"use client";

import { createContext, startTransition, useActionState, useContext, type FormEvent, type ReactNode } from "react";
import type { ActionResult, UserErrorCode } from "@/lib/actionResult";
import { styles } from "./ui";

type ActionFormProps = {
  action: (previous: ActionResult, formData: FormData) => Promise<ActionResult>;
  errorMessages: Record<UserErrorCode, string>;
  /** Shown after a successful submission that stays on the page. */
  successMessage?: string;
  /** Shown in a native confirm dialog before submitting. */
  confirmMessage?: string;
  className?: string;
  children: ReactNode;
};

const PendingContext = createContext(false);

/**
 * Form bound to a server action that returns an ActionResult. Shows the
 * translated business error (and its details) or a success message.
 *
 * Submits via onSubmit + startTransition instead of <form action>, because
 * React resets every uncontrolled field after a <form action> completes:
 * a validation error would otherwise wipe everything the user typed.
 */
export function ActionForm({ action, errorMessages, successMessage, confirmMessage, className, children }: ActionFormProps) {
  const [result, formAction, pending] = useActionState(action, null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (confirmMessage !== undefined && !window.confirm(confirmMessage)) return;
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
    <form onSubmit={handleSubmit} className={className ?? "flex flex-col gap-3"}>
      <PendingContext value={pending}>{children}</PendingContext>
      {result !== null && !result.ok && (
        <div role="alert" className={styles.error}>
          <p>{errorMessages[result.error]}</p>
          {result.details.length > 0 && (
            <ul className="mt-1 list-disc ps-5">
              {result.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {result !== null && result.ok && successMessage !== undefined && (
        <p role="status" className={styles.success}>
          {successMessage}
        </p>
      )}
    </form>
  );
}

/** Submit button that disables itself while its ActionForm is submitting. */
export function SubmitButton({ className, children }: { className?: string; children: ReactNode }) {
  const pending = useContext(PendingContext);
  return (
    <button type="submit" disabled={pending} className={className ?? styles.buttonPrimary}>
      {children}
    </button>
  );
}
