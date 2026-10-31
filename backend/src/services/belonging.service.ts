import { belongingRepository } from "../repositories/belonging.repository.js";

export const belongingService = {
  list: (patientId: number) => belongingRepository.findByPatient(patientId),
  create: belongingRepository.create,
  update: (id: number, params: Parameters<typeof belongingRepository.update>[1]) =>
    belongingRepository.update(id, params),
  remove: (id: number) => belongingRepository.remove(id),
};
