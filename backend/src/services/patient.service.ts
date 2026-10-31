import { patientRepository } from "../repositories/patient.repository.js";

export const patientService = {
  listForNurse: (nurseId: number) => patientRepository.findByNurseId(nurseId),
  listAll: () => patientRepository.findAll(),

  async getDetail(patientId: number) {
    const [patient, todayTasks, belongings] = await Promise.all([
      patientRepository.findById(patientId),
      patientRepository.findTodayTasks(patientId),
      patientRepository.findBelongings(patientId),
    ]);
    if (!patient) return null;
    return { patient, todayTasks, belongings };
  },
};
