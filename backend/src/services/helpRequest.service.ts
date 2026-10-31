import { helpRequestRepository } from "../repositories/helpRequest.repository.js";
import type { RequestStatus } from "../types/domain.js";

export const helpRequestService = {
  listForNurse: async (nurseId: number, status?: RequestStatus) => {
    await helpRequestRepository.expireOverdue();
    return helpRequestRepository.findByNurse(nurseId, status);
  },
  getById: async (id: number) => {
    await helpRequestRepository.expireOverdue();
    return helpRequestRepository.findById(id);
  },

  // Dipakai 2 jalur: tombol fisik (triggeredByInteractionId = null) dan dari AI (terisi).
  create: (
    patientId: number,
    deviceId: number,
    triggeredByInteractionId: number | null = null,
  ) =>
    helpRequestRepository.create({
      patientId,
      deviceId,
      triggeredByInteractionId,
    }),

  acknowledge: (id: number) =>
    helpRequestRepository.updateStatus(id, "ACKNOWLEDGED"),
  resolve: (id: number) => helpRequestRepository.updateStatus(id, "RESOLVED"),
  expire: (id: number) => helpRequestRepository.updateStatus(id, "EXPIRED"),
  expireOverdue: () => helpRequestRepository.expireOverdue(),
};
