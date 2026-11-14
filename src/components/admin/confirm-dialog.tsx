"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/field";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  dangerous = false,
  withReason = false,
  busy = false,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  dangerous?: boolean;
  withReason?: boolean;
  busy?: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
}) {
  const [reason, setReason] = useState("");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={dangerous ? "danger" : "primary"}
            loading={busy}
            onClick={() => {
              onConfirm(reason.trim() || undefined);
              setReason("");
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {withReason ? (
        <label className="block text-sm text-ink-700">
          Reason (optional)
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="mt-2 min-h-20"
            placeholder="Shared with the customer in their order history."
          />
        </label>
      ) : (
        <p className="text-sm text-ink-600">
          Please confirm. This action is recorded and cannot be undone automatically.
        </p>
      )}
    </Modal>
  );
}
