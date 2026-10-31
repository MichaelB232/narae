import { helpRequestRepository } from "../repositories/helpRequest.repository.js";
import type { RequestStatus } from "../types/domain.js";

export const helpRequestService = {
  listForNurse: (nurseId: number, status?: RequestStatus) => helpRequestRepository.findByNurse(nurseId, status),

  // Dipakai 2 jalur: tombol fisik (triggeredByInteractionId = null) dan dari AI (terisi).
  create: (patientId: number, deviceId: number, triggeredByInteractionId: number | null = null) =>
    helpRequestRepository.create({ patientId, deviceId, triggeredByInteractionId }),

  acknowledge: (id: number) => helpRequestRepository.updateStatus(id, "ACKNOWLEDGED"),
  resolve: (id: number) => helpRequestRepository.updateStatus(id, "RESOLVED"),
  expireOverdue: () => helpRequestRepository.expireOverdue(),
};
