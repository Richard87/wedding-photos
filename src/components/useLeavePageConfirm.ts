import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { NavigateOptions } from "next/dist/shared/lib/app-router-context.shared-runtime";

export const useLeavePageConfirm = (hasUnsavedChanges: boolean) => {
  const router = useRouter();

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
      }
    };

    const originalPush = router.push;

    router.push = (url: string, options?: NavigateOptions) => {
      if (hasUnsavedChanges) {
        const confirmLeave = window.confirm(
          "You have unsaved changes. Are you sure you want to leave?"
        );
        if (confirmLeave) {
          originalPush(url, options);
        }
      } else {
        originalPush(url, options);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      router.push = originalPush;
    };
  }, [router, hasUnsavedChanges]);
};