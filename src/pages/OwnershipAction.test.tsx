import { StrictMode } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { queryClient } from "../services/react-query";
import {
  fetchDogOwnershipAction,
  respondToDogInvite,
} from "../services/dog-ownership";
import { ModeProvider } from "../context/ModeContext";
import { OwnershipAction } from "./OwnershipAction";
import OwnershipActionRedirect from "./OwnershipActionRedirect";

const state = vi.hoisted(() => ({ notify: vi.fn(), isOwner: false }));
vi.mock("../context/UserContext", async () => {
  const { createContext } = await import("react");
  return { UserContext: createContext({ userId: "recipient" }) };
});
vi.mock("../context/NotificationContext", () => ({
  useNotification: () => ({ notify: state.notify }),
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("../services/dog-ownership", () => ({
  fetchDogOwnershipAction: vi.fn(),
  respondToDogInvite: vi.fn(),
  respondToDogOwnershipRequest: vi.fn(),
  respondToPrimaryTransfer: vi.fn(),
}));
vi.mock("../services/dogs", () => ({
  fetchDogPage: vi.fn(async () => ({
    dog: { name: "Milo" },
    capabilities: { enabled: true },
    viewer: { is_owner: state.isOwner },
  })),
}));
const pendingAction = {
  id: "invitation",
  dog_id: "dog",
  status: "PENDING",
  expires_at: "",
  invitee_user_id: "recipient",
  primary_user_id_at_creation: "primary",
};

beforeEach(() => {
  state.isOwner = false;
  const portal = document.createElement("div");
  portal.id = "modal";
  document.body.append(portal);
  vi.mocked(fetchDogOwnershipAction).mockResolvedValue(pendingAction);
});
afterEach(() => {
  cleanup();
  queryClient.clear();
  vi.clearAllMocks();
  document.getElementById("modal")?.remove();
});
const renderInvitation = () =>
  render(
    <ModeProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter
          initialEntries={["/dogs/dog/ownership/actions/invite/invitation"]}
        >
          <Routes>
            <Route
              path="/dogs/:dogId/ownership/actions/:actionType/:actionId"
              element={<OwnershipAction invitationId="invitation" />}
            />
            <Route path="/dogs/:dogId/ownership" element={<p>Owner tab</p>} />
            <Route path="/dogs/:dogId" element={<p>Dog details</p>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </ModeProvider>,
  );

it.each([true, false])(
  "keeps the form busy through refresh then closes with a toast (approve=%s)",
  async (approve) => {
    renderInvitation();
    fireEvent.click(await screen.findByRole("checkbox"));
    let finishRefresh: (
      value: Awaited<ReturnType<typeof fetchDogOwnershipAction>>,
    ) => void = () => {};
    vi.mocked(fetchDogOwnershipAction).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishRefresh = resolve;
        }),
    );
    const outcome = approve ? "ACCEPTED" : "DECLINED";
    vi.mocked(respondToDogInvite).mockImplementationOnce(async () => {
      state.isOwner = approve;
      return { outcome };
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: approve ? "dogOwnership.approve" : "dogOwnership.decline",
      }),
    );
    await waitFor(() =>
      expect(fetchDogOwnershipAction).toHaveBeenCalledTimes(2),
    );
    expect(
      screen
        .getAllByRole("button")
        .every((button) => button.hasAttribute("disabled")),
    ).toBe(true);
    expect(state.notify).not.toHaveBeenCalled();
    await act(async () => finishRefresh({ ...pendingAction, status: outcome }));
    await screen.findByText(approve ? "Owner tab" : "Dog details");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(state.notify).toHaveBeenCalledWith(
      `dogOwnership.outcomes.${outcome}`,
      false,
    );
  },
);

it("keeps failed decisions retryable and reports the error through the shared toast", async () => {
  renderInvitation();
  fireEvent.click(await screen.findByRole("checkbox"));
  vi.mocked(respondToDogInvite).mockRejectedValueOnce(new Error("Offline"));
  fireEvent.click(screen.getByRole("button", { name: "dogOwnership.approve" }));
  await waitFor(() =>
    expect(state.notify).toHaveBeenCalledWith(
      "dogOwnership.requestError",
      true,
    ),
  );
  await waitFor(() =>
    expect(
      screen
        .getByRole("button", { name: "dogOwnership.approve" })
        .hasAttribute("disabled"),
    ).toBe(false),
  );
  expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(true);
});

// Deep links resolve over the dog; StrictMode must not announce a result twice.
it.each([true, false])(
  "routes completed notifications to the permitted dog view once (owner=%s)",
  async (isOwner) => {
    state.isOwner = isOwner;
    vi.mocked(fetchDogOwnershipAction).mockResolvedValue({
      ...pendingAction,
      status: "ACCEPTED",
    });
    render(
      <StrictMode>
        <ModeProvider>
          <QueryClientProvider client={queryClient}>
            <MemoryRouter
              initialEntries={["/ownership-actions/invite/invitation"]}
            >
              <Routes>
                <Route
                  path="/ownership-actions/:actionType/:actionId"
                  element={<OwnershipActionRedirect />}
                />
                <Route
                  path="/dogs/:dogId/ownership"
                  element={<p>Owner tab</p>}
                />
                <Route path="/dogs/:dogId" element={<p>Dog details</p>} />
              </Routes>
            </MemoryRouter>
          </QueryClientProvider>
        </ModeProvider>
      </StrictMode>,
    );
    await screen.findByText(isOwner ? "Owner tab" : "Dog details");
    expect(state.notify).not.toHaveBeenCalled();
  },
);
