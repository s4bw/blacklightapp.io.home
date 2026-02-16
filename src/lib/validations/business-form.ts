import { z } from "zod/v3";

export const BUSINESS_CATEGORIES = [
  "Arts, Media & Creative",
  "Auto, Transport & Logistics",
  "Beauty & Personal Care",
  "Business, Marketing & Consulting",
  "Contractors, Home, & Building Services",
  "Education, Training & Nonprofits",
  "Energy & Environmental",
  "Food & Drink",
  "Government, Public & Infrastructure",
  "Health & Wellness",
  "Legal, Financial & Professional",
  "Manufacturing, Industrial & Wholesale",
  "Other / Specialty Services",
  "Shops & Retail",
  "Tech & Digital Services",
  "Travel, Hospitality & Events",
] as const;

const FACEBOOK_REGEX = /^(https?:\/\/)?(www\.|m\.|mbasic\.)?facebook\.com(\/.*)?$/i;
const INSTAGRAM_REGEX = /^(https?:\/\/)?(www\.)?instagram\.com(\/.*)?$/i;
const LINKEDIN_REGEX = /^(https?:\/\/)?(www\.)?linkedin\.com(\/.*)?$/i;

const optionalSocialUrl = (regex: RegExp, platform: string) =>
  z.union([
    z.literal(""),
    z
      .string()
      .transform((s) => s.trim())
      .refine((s) => s === "" || regex.test(s), `Enter a valid ${platform} URL (e.g. ${platform}.com/yourpage)`),
  ]);

const websiteSchema = z
  .string()
  .transform((s) => s.trim())
  .refine(
    (s) => {
      const withProtocol = /^https?:\/\//i.test(s) ? s : `https://${s}`;
      try {
        const u = new URL(withProtocol);
        if (u.protocol !== "http:" && u.protocol !== "https:") return false;
        // Require a proper domain (has a TLD / dot)
        return u.hostname.includes(".");
      } catch {
        return false;
      }
    },
    "Enter a valid website URL (e.g. example.com or www.example.com)"
  );

const locationSchema = z.object({
  street: z.string().min(1, "Address line 1 is required"),
  street2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip_code: z
    .string()
    .regex(/^\d{5}(?:-\d{4})?$/, "Enter a valid ZIP code"),
  phone: z
    .union([z.literal(""), z.string().regex(/^\d{10}$/, "Phone must be 10 digits")])
    .optional(),
  email: z.union([z.literal(""), z.string().email("Invalid email")]).optional(),
});

export const businessFormSchema = z
  .object({
    business_name: z.string().min(1, "Business name is required"),
    Category: z.enum(BUSINESS_CATEGORIES),
    description: z
      .string()
      .min(1, "Business description is required")
      .max(500, "Description must be 500 characters or fewer"),
    products: z
      .string()
      .min(1, "Products/services are required")
      .max(300, "Products/services must be 300 characters or fewer"),
    website: websiteSchema,
    phone: z.string().regex(/^\d{10}$/, "Phone must be exactly 10 digits"),
    email: z.string().email("Enter a valid email address"),
    contact_first: z.string().min(1, "First name is required"),
    contact_last: z.string().min(1, "Last name is required"),
    street: z.string().min(1, "Address line 1 is required"),
    street2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    zip_code: z
      .string()
      .regex(/^\d{5}(?:-\d{4})?$/, "Enter a valid ZIP code"),
    tags: z.string().optional(),
    African_American: z.boolean(),
    "Women-American": z.boolean(),
    type_of_business: z.enum(["physical", "online", "both"]),
    is_usa_based: z.boolean(),
    consent_marketing: z
      .boolean()
      .refine((value) => value, "Marketing consent is required"),
    facebook: optionalSocialUrl(FACEBOOK_REGEX, "facebook"),
    instagram: optionalSocialUrl(INSTAGRAM_REGEX, "instagram"),
    linkedin: optionalSocialUrl(LINKEDIN_REGEX, "linkedin"),
    keywords: z
      .array(z.string().trim().min(1, "Keyword is required"))
      .min(1, "Add at least one keyword")
      .max(5, "Maximum 5 keywords"),
    has_multiple_locations: z.boolean(),
    additional_locations: z.array(locationSchema).max(5, "Maximum 5 locations"),
  })
  .superRefine((values, context) => {
    if (!values.African_American && !values["Women-American"]) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["African_American"],
        message: "Select at least one ownership option",
      });
    }

    if (values.has_multiple_locations && values.additional_locations.length > 0) {
      return;
    }

    if (values.has_multiple_locations && values.additional_locations.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["additional_locations"],
        message: "Add at least one additional location",
      });
    }
  });

export type BusinessFormValues = z.infer<typeof businessFormSchema>;

export const businessFormDefaultValues: BusinessFormValues = {
  business_name: "",
  Category: BUSINESS_CATEGORIES[0],
  description: "",
  products: "",
  website: "",
  phone: "",
  email: "",
  contact_first: "",
  contact_last: "",
  street: "",
  street2: "",
  city: "",
  state: "",
  zip_code: "",
  tags: "",
  African_American: false,
  "Women-American": false,
  type_of_business: "physical",
  is_usa_based: true,
  consent_marketing: true,
  facebook: "",
  instagram: "",
  linkedin: "",
  keywords: [],
  has_multiple_locations: false,
  additional_locations: [],
};
