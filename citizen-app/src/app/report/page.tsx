"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/LanguageProvider";
import { useAuth } from "@/components/AuthProvider";
import { AuthCard } from "@/components/AuthCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { TextField, TextAreaField, SelectField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { ImageUploader, type PickedImage } from "@/components/ImageUploader";
import { LocationCapture, type Coordinates } from "@/components/LocationCapture";
import { problemInputSchema, CATEGORIES } from "@/lib/validation";
import { JHARKHAND_DISTRICTS } from "@/lib/districts";
import { submitProblemClient } from "@/lib/problemClient";

type FormState = {
  title: string;
  description: string;
  category: string;
  district: string;
  villageLocality: string;
  peopleAffected: string;
};

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  category: "",
  district: "",
  villageLocality: "",
  peopleAffected: "",
};

type Step = "form" | "review";

export default function ReportProblemPage() {
  const t = useT();
  const router = useRouter();
  const { user, loading } = useAuth();

  const [step, setStep] = useState<Step>("form");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [images, setImages] = useState<PickedImage[]>([]);
  const [coords, setCoords] = useState<Coordinates>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): boolean {
    const result = problemInputSchema.safeParse({
      title: form.title,
      description: form.description,
      category: form.category,
      district: form.district,
      villageLocality: form.villageLocality,
      peopleAffected: form.peopleAffected === "" ? undefined : Number(form.peopleAffected),
      latitude: coords?.latitude,
      longitude: coords?.longitude,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const [key, msgs] of Object.entries(result.error.flatten().fieldErrors)) {
        if (msgs && msgs[0]) fieldErrors[key] = msgs[0];
      }
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  }

  function goToReview() {
    if (validate()) setStep("review");
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (!user) {
        throw new Error(t.authRequiredTitle || "Please sign in to submit a problem.");
      }

      const result = await submitProblemClient({
        title: form.title,
        description: form.description,
        category: form.category,
        district: form.district,
        villageLocality: form.villageLocality,
        peopleAffected: form.peopleAffected !== "" ? Number(form.peopleAffected) : undefined,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        locationAccuracyM: coords?.accuracy,
        images: images.map((img) => img.file),
        citizenId: user.id,
      });

      router.push(`/report/success?id=${encodeURIComponent(result.challengeId)}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t.errorGeneric);
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center bg-slate-50 min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-800" />
          <p className="text-sm font-medium text-slate-500">{t.loading}</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex flex-1 flex-col bg-slate-50 min-h-screen">
        <PageHeader title={t.reportTitle} onBack={() => router.push("/home")} />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-8">
          <AuthCard embedded={true} redirectPath="/report" />
        </div>
      </main>
    );
  }

  if (step === "review") {
    return (
      <main className="flex flex-1 flex-col">
        <PageHeader title={t.reviewTitle} onBack={() => setStep("form")} />
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-6">
          <p className="text-slate-500">{t.reviewSubtitle}</p>

          <ReviewRow label={t.fieldTitle} value={form.title} />
          <ReviewRow label={t.fieldDescription} value={form.description} />
          <ReviewRow label={t.fieldCategory} value={form.category || t.notProvided} />
          <ReviewRow label={t.fieldDistrict} value={form.district} />
          <ReviewRow label={t.fieldVillage} value={form.villageLocality} />
          <ReviewRow
            label={t.fieldPeopleAffected}
            value={form.peopleAffected || t.notProvided}
          />
          <ReviewRow
            label={t.fieldLocation}
            value={
              coords
                ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`
                : t.locationUnavailable
            }
          />
          <ReviewRow
            label={t.attachedEvidence}
            value={images.length > 0 ? `${images.length} photo(s)` : t.noEvidence}
          />

          {submitError && (
            <p className="rounded-xl bg-red-50 px-4 py-3 font-medium text-red-700">
              {submitError}
            </p>
          )}

          <div className="mt-4 flex flex-col gap-3">
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? t.submitting : t.submitProblem}
            </Button>
            <Button variant="outline" onClick={() => setStep("form")} disabled={submitting}>
              {t.edit}
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col">
      <PageHeader title={t.reportTitle} onBack={() => router.push("/home")} />

      <form
        className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-4 py-6"
        onSubmit={(e) => {
          e.preventDefault();
          goToReview();
        }}
      >
        <TextField
          label={t.fieldTitle}
          required
          placeholder={t.fieldTitlePlaceholder}
          value={form.title}
          onChange={(e) => updateField("title", e.target.value)}
          error={errors.title}
        />

        <TextAreaField
          label={t.fieldDescription}
          required
          placeholder={t.fieldDescriptionPlaceholder}
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
          error={errors.description}
        />

        <SelectField
          label={t.fieldCategory}
          value={form.category}
          onChange={(e) => updateField("category", e.target.value)}
        >
          <option value="">{t.fieldCategoryPlaceholder}</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </SelectField>

        <TextField
          label={t.fieldDistrict}
          required
          list="district-options"
          placeholder={t.fieldDistrictPlaceholder}
          value={form.district}
          onChange={(e) => updateField("district", e.target.value)}
          error={errors.district}
        />
        <datalist id="district-options">
          {JHARKHAND_DISTRICTS.map((d) => (
            <option key={d} value={d} />
          ))}
        </datalist>

        <TextField
          label={t.fieldVillage}
          required
          placeholder={t.fieldVillagePlaceholder}
          value={form.villageLocality}
          onChange={(e) => updateField("villageLocality", e.target.value)}
          error={errors.villageLocality}
        />

        <TextField
          label={t.fieldPeopleAffected}
          type="number"
          min={1}
          placeholder={t.fieldPeopleAffectedPlaceholder}
          value={form.peopleAffected}
          onChange={(e) => updateField("peopleAffected", e.target.value)}
          error={errors.peopleAffected}
        />

        <ImageUploader images={images} onChange={setImages} />

        <LocationCapture value={coords} onChange={setCoords} />

        <div className="mt-2">
          <Button type="submit">{t.next}</Button>
        </div>
      </form>
    </main>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-slate-900">{value}</p>
    </div>
  );
}
