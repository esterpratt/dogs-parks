import { useContext, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Loader } from "../components/Loader";
import { UnavailableNotificationTarget } from "../components/notifications/UnavailableNotificationTarget";
import { UserContext } from "../context/UserContext";
import { fetchDogOwnershipAction } from "../services/dog-ownership";
import { fetchDogPage } from "../services/dogs";

const OwnershipActionRedirect = () => {
  const { actionType, actionId } = useParams();
  const { userId } = useContext(UserContext);
  const navigate = useNavigate();
  const handledAction = useRef<string>();
  const type =
    actionType === "request"
      ? "request"
      : actionType === "transfer"
        ? "transfer"
        : "invite";
  const {
    data: action,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["dogOwnershipAction", type, actionId, userId],
    queryFn: () => fetchDogOwnershipAction(type, actionId!),
    enabled: !!actionId,
  });
  const {
    data: dogPage,
    isLoading: isLoadingDog,
    isError: isDogError,
  } = useQuery({
    // Permissions belong to this viewer, never a previous account.
    queryKey: ["dogPage", action?.dog_id, userId],
    queryFn: () => fetchDogPage(action!.dog_id),
    enabled: !!action?.dog_id,
  });
  useEffect(() => {
    if (!action || !dogPage || handledAction.current === action.id) {
      return;
    }
    // Resolve each notification once without replaying its completed action as a toast.
    handledAction.current = action.id;
    // Notifications contain an action ID. Resolve it through participant-only
    // reads, then show the current action in the ownership tab.
    const canRespond =
      type === "invite"
        ? "invitee_user_id" in action && action.invitee_user_id === userId
        : type === "transfer"
          ? "to_user_id" in action && action.to_user_id === userId
          : "primary_user_id_at_creation" in action &&
            action.primary_user_id_at_creation === userId;
    const destination = `/dogs/${action.dog_id}`;
    if (
      dogPage.capabilities.enabled &&
      action.status === "PENDING" &&
      canRespond
    ) {
      navigate(`${destination}/ownership`, {
        replace: true,
      });
    } else {
      navigate(
        `${destination}/ownership?status=${encodeURIComponent(action.status)}&action=${type}`,
        { replace: true },
      );
    }
  }, [action, dogPage, navigate, type, userId]);

  if (isLoading || isLoadingDog || (action && dogPage)) {
    return <Loader style={{ paddingTop: "64px" }} />;
  }
  return (
    <UnavailableNotificationTarget
      descriptionKey={
        isError || isDogError
          ? "dogOwnership.requestError"
          : undefined
      }
    />
  );
};

export default OwnershipActionRedirect;
