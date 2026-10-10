import { useContext, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader } from "../components/Loader";
import { UserContext } from "../context/UserContext";
import { fetchDogOwnershipAction } from "../services/dog-ownership";
import { fetchDogPage } from "../services/dogs";
import styles from "./DogOwnership.module.scss";

const OwnershipActionRedirect = () => {
  const { actionType, actionId } = useParams();
  const { userId } = useContext(UserContext);
  const { t } = useTranslation();
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
    // reads, then open the decision over the dog or go straight to Ownership.
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
      navigate(
        type === "invite"
          ? `${destination}/ownership`
          : `${destination}/ownership/actions/${type}/${action.id}`,
        {
          replace: true,
        },
      );
    } else {
      navigate(
        dogPage.viewer.is_owner ? `${destination}/ownership` : destination,
        { replace: true },
      );
    }
  }, [action, dogPage, navigate, type, userId]);

  if (isLoading || isLoadingDog || (action && dogPage)) {
    return <Loader style={{ paddingTop: "64px" }} />;
  }
  return (
    <main className={styles.container}>
      <p>
        {t(
          isError || isDogError
            ? "dogOwnership.requestError"
            : "dogOwnership.outcomes.NOT_FOUND",
        )}
      </p>
      <Link className={styles.actionLink} to={`/profile/${userId}/dogs`}>
        {t("userDogs.titleMyPack")}
      </Link>
    </main>
  );
};

export default OwnershipActionRedirect;
