import { z } from 'zod'

const optionalNumber = (min: number, max: number, label: string) =>
  z
    .string()
    .optional()
    .refine(
      (v) => v === undefined || v === '' || (Number.isFinite(Number(v)) && Number(v) >= min && Number(v) <= max),
      `${label} must be between ${min} and ${max}`,
    )

export const measurementSchema = z.object({
  measured_on: z.string().min(1, 'Date is required'),
  weight_kg: optionalNumber(20, 400, 'Weight'),
  waist_cm: optionalNumber(30, 250, 'Waist'),
  hip_cm: optionalNumber(30, 250, 'Hip'),
  chest_cm: optionalNumber(30, 250, 'Chest'),
  thigh_cm: optionalNumber(20, 150, 'Thigh'),
  arm_cm: optionalNumber(15, 100, 'Arm'),
  notes: z.string().optional(),
})

export type MeasurementValues = z.infer<typeof measurementSchema>

export function normalizeMeasurement(values: MeasurementValues) {
  const n = (v: string | undefined) => (v === '' || v === undefined ? null : Number(v))
  return {
    measured_on: values.measured_on,
    weight_kg: n(values.weight_kg),
    waist_cm: n(values.waist_cm),
    hip_cm: n(values.hip_cm),
    chest_cm: n(values.chest_cm),
    thigh_cm: n(values.thigh_cm),
    arm_cm: n(values.arm_cm),
    notes: values.notes || null,
  }
}