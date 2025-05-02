import { useEffect, useRef } from "react";

const useModal = (open: boolean) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  
    useEffect(() => {
      const modal = dialogRef.current;
  
      if (open) {
        modal!.showModal();
      }
  
      return () => {
        modal!.close();
      };
    }, [open]);

    return dialogRef;
}

export { useModal}