"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  BUSINESS_CATEGORIES,
  businessFormDefaultValues,
  businessFormSchema,
  type BusinessFormValues,
} from "@/lib/validations/business-form";
import { toast } from "sonner";

const FORM_ID = "business-profile-form";

type JoinPayload = Omit<BusinessFormValues, "tags"> & {
  tags: string[];
  Not_USA: 0 | 1;
};

function toTenDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10);
}

function getSubmitErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data;

    if (responseData && typeof responseData === "object" && "error" in responseData) {
      const errorMessage = responseData.error;
      if (typeof errorMessage === "string" && errorMessage.length > 0) {
        return errorMessage;
      }
    }

    return error.message;
  }

  return "Failed to submit form. Please try again.";
}

export function BusinessProfileForm() {
  const form = useForm<BusinessFormValues>({
    resolver: zodResolver(businessFormSchema),
    defaultValues: businessFormDefaultValues,
    mode: "onSubmit",
  });

  const descriptionValue = useWatch({
    control: form.control,
    name: "description",
  });
  const productsValue = useWatch({
    control: form.control,
    name: "products",
  });
  const hasMultipleLocations = useWatch({
    control: form.control,
    name: "has_multiple_locations",
  });

  const keywordValues = useWatch({
    control: form.control,
    name: "keywords",
    defaultValue: [],
  });
  const keywordList = Array.isArray(keywordValues) ? keywordValues : [];

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "additional_locations",
  });

  const submitMutation = useMutation({
    mutationFn: async (payload: JoinPayload) => {
      const response = await axios.post<{ ok: boolean }>("/api/join", payload);
      return response.data;
    },
    onSuccess: () => {
      form.reset(businessFormDefaultValues);
      toast.success("Form submitted successfully.");
    },
    onError: (error) => {
      toast.error(getSubmitErrorMessage(error));
    },
  });

  useEffect(() => {
    if (!hasMultipleLocations) {
      replace([]);
    }
  }, [hasMultipleLocations, replace]);

  function onSubmit(values: BusinessFormValues) {
    const parsedTags = (values.tags ?? "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const payload = {
      ...values,
      tags: parsedTags,
      Not_USA: values.is_usa_based ? 0 : 1,
    } satisfies JoinPayload;

    submitMutation.reset();
    submitMutation.mutate(payload);
  }

  return (
    <Card className="shadow-none border-none bg-transparent text-white max-w-3xl">
      <CardHeader className="space-y-2 flex flex-col items-center justify-center">
        <CardTitle className="md:text-6xl text-4xl font-medium">Join BlackLight®!</CardTitle>
        <CardDescription className="md:text-xl text-base text-center max-w-xl text-white">
        Add your business to the BlackLight® network to 
        become more visible to more buyers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            id={FORM_ID}
            onSubmit={form.handleSubmit(onSubmit, (errors) => {
              toast.error(getSubmitErrorMessage(errors));
            })}
            className="space-y-8 [&_input]:bg-white [&_input]:text-black [&_input]:text-lg [&_input]:px-4 [&_input]:py-2.5 dark:[&_input]:bg-white dark:[&_input]:text-black [&_textarea]:bg-white [&_textarea]:text-black [&_textarea]:text-lg [&_textarea]:px-4 [&_textarea]:py-3 dark:[&_textarea]:bg-white dark:[&_textarea]:text-black **:data-[slot=select-trigger]:bg-white **:data-[slot=select-trigger]:text-black **:data-[slot=select-trigger]:text-lg **:data-[slot=select-trigger]:px-4 **:data-[slot=select-trigger]:py-2.5"
          >
            <section className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="business_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg">Business Name <span className="text-gray-300/80 text-base font-normal">(required)</span></FormLabel>
                      <FormControl>
                        <Input {...field} className="rounded-none"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="Category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg">Main Business Category <span className="text-gray-300/80 text-base font-normal">(required)</span></FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full rounded-none bg-white text-black dark:bg-white dark:text-black">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white text-black rounded-none">
                          {BUSINESS_CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="text-lg">Business Description <span className="text-gray-300/80 text-base font-normal">(required)</span></FormLabel>
                      <FormDescription>
                        Describe your business&apos;s main purpose in a few
                        sentences.
                      </FormDescription>
                      <FormControl>
                        <Textarea {...field} className="rounded-none" />
                      </FormControl>
                      <FormDescription>
                        {descriptionValue.length}/500 characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="products"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="text-lg">Products / Services <span className="text-gray-300/80 text-base font-normal">(required)</span></FormLabel>
                      <FormDescription>
                        Main products and/or services list, separated by commas.
                      </FormDescription>
                      <FormControl>
                        <Textarea {...field} className="rounded-none"/>
                      </FormControl>
                      <FormDescription>
                        {productsValue.length}/300 characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="text-lg">Website <span className="text-gray-300/80 text-base font-normal">(required)</span></FormLabel>
                      <FormControl>
                        <Input {...field} className="rounded-none"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <section className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg">Phone <span className="text-gray-300/80 text-base font-normal">(required)</span></FormLabel>
                      <FormControl>
                        <Input
                          inputMode="numeric"
                          value={field.value}
                          onChange={(event) =>
                            field.onChange(toTenDigits(event.target.value))
                          }
                          className="rounded-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg">Email <span className="text-gray-300/80 text-base font-normal">(required)</span></FormLabel>
                      <FormControl>
                        <Input {...field} className="rounded-none"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contact_first"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg">First Name <span className="text-gray-300/80 text-base font-normal">(required)</span></FormLabel>
                      <FormControl>
                        <Input {...field} className="rounded-none"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contact_last"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg">Last Name <span className="text-gray-300/80 text-base font-normal">(required)</span></FormLabel>
                      <FormControl>
                        <Input {...field} className="rounded-none"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <section className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="text-lg">Address Line 1 <span className="text-gray-300/80 text-base font-normal">(required)</span></FormLabel>
                      <FormControl>
                        <Input {...field} className="rounded-none"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="street2"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="text-lg">Address Line 2 <span className="text-gray-300/80 text-base font-normal">(optional)</span></FormLabel>
                      <FormControl>
                        <Input {...field} className="rounded-none"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 grid-cols-1 md:grid-cols-3 md:col-span-2">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg">City <span className="text-gray-300/80 text-base font-normal">(required)</span></FormLabel>
                        <FormControl>
                          <Input {...field} className="rounded-none"/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg">State <span className="text-gray-300/80 text-base font-normal">(required)</span></FormLabel>
                        <FormControl>
                          <Input {...field} className="rounded-none"/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="zip_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg">ZIP Code <span className="text-gray-300/80 text-base font-normal">(required)</span></FormLabel>
                        <FormControl>
                          <Input {...field} className="rounded-none"/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="space-y-4">
                <FieldSet className="**:data-[slot=checkbox]:bg-white **:data-[slot=checkbox]:border-gray-300">
                  <FieldLegend variant="label" className="text-lg! text-white font-medium mb-4">
                    Check all that apply <span className="text-gray-300/80 text-base font-normal">(required)</span>
                  </FieldLegend>
                  <FieldGroup data-slot="checkbox-group" className="gap-4">
                    <Controller
                      name="African_American"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field
                          orientation="horizontal"
                          data-invalid={fieldState.invalid}
                        >
                          <Checkbox
                            id="ownership-african-american"
                            name={field.name}
                            checked={field.value}
                            aria-invalid={fieldState.invalid}
                            onCheckedChange={(checked) =>
                              field.onChange(checked === true)
                            }
                          />
                          <FieldLabel
                            htmlFor="ownership-african-american"
                            className="font-normal text-white text-lg"
                          >
                            I am a Black-owned Business
                          </FieldLabel>
                        </Field>
                      )}
                    />
                    <Controller
                      name="Women-American"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field
                          orientation="horizontal"
                          data-invalid={fieldState.invalid}
                        >
                          <Checkbox
                            id="ownership-women-american"
                            name={field.name}
                            checked={field.value}
                            aria-invalid={fieldState.invalid}
                            onCheckedChange={(checked) =>
                              field.onChange(checked === true)
                            }
                          />
                          <FieldLabel
                            htmlFor="ownership-women-american"
                            className="font-normal text-white text-lg"
                          >
                            I am a Women-owned Black-owned Business
                          </FieldLabel>
                        </Field>
                      )}
                    />
                  </FieldGroup>
                  <FieldError
                    errors={[
                      form.formState.errors.African_American,
                      form.formState.errors["Women-American"],
                    ]}
                  />
                </FieldSet>

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg">Tags</FormLabel>
                      <FormDescription>
                        Tags are a quick way for customers to understand your
                        products, services, or specialties.
                      </FormDescription>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          className="rounded-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <section className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="facebook"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg">Facebook</FormLabel>
                      <FormControl>
                        <Input {...field} className="rounded-none" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="instagram"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg">Instagram</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="rounded-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="linkedin"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="text-lg">LinkedIn</FormLabel>
                      <FormControl>
                        <Input {...field} className="rounded-none" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="md:col-span-2 space-y-3 rounded-md border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Keywords <span className="text-gray-300/80 text-base font-normal">(required)</span></h3>
                      <FormDescription className="mt-1">
                        Pick up to 5 keywords for use in searches for your business.
                      </FormDescription>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        form.setValue("keywords", [...keywordList, ""], {
                          shouldValidate: true,
                        })
                      }
                      disabled={keywordList.length >= 5}
                    >
                      Add keyword
                    </Button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {keywordList.map((_, index) => (
                      <FormField
                        key={index}
                        control={form.control}
                        name={`keywords.${index}`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start gap-2 space-y-0">
                            <FormControl className="flex-1">
                              <Input {...field} className="rounded-none" />
                            </FormControl>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="shrink-0"
                              onClick={() => {
                                const next = keywordList.filter(
                                  (_, i) => i !== index
                                );
                                form.setValue("keywords", next, {
                                  shouldValidate: true,
                                });
                              }}
                              aria-label={`Remove keyword ${index + 1}`}
                            >
                              Remove
                            </Button>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FieldError
                    errors={
                      form.formState.errors.keywords?.root
                        ? [form.formState.errors.keywords.root]
                        : undefined
                    }
                  />
                </div>

                <FormField
                  control={form.control}
                  name="has_multiple_locations"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2 flex items-center justify-between rounded-md border p-4">
                      <div>
                        <FormLabel className="text-lg">Do you have multiple locations? <span className="text-gray-300/80 text-base font-normal">(required)</span></FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </section>

            {hasMultipleLocations && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      append({
                        street: "",
                        street2: "",
                        city: "",
                        state: "",
                        zip_code: "",
                        phone: "",
                        email: "",
                      })
                    }
                    disabled={fields.length >= 5}
                  >
                    Add Location
                  </Button>
                </div>

                <FieldError
                  errors={[
                    form.formState.errors.additional_locations as {
                      message?: string;
                    },
                    form.formState.errors.additional_locations?.root,
                  ]}
                />

                {fields.map((item, index) => (
                  <div key={item.id} className="space-y-4 rounded-md border p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{`Location ${index + 1}`}</h3>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => remove(index)}
                      >
                        Remove
                      </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name={`additional_locations.${index}.street`}
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel className="text-lg">Address Line 1 <span className="text-gray-300/80 text-base font-normal">(required)</span></FormLabel>
                            <FormControl>
                              <Input {...field} className="rounded-none" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`additional_locations.${index}.street2`}
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel className="text-lg">Address Line 2</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? ""}
                                className="rounded-none"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid gap-4 grid-cols-1 md:grid-cols-3 md:col-span-2">
                        <FormField
                          control={form.control}
                          name={`additional_locations.${index}.city`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-lg">City <span className="text-gray-300/80 text-base font-normal">(required)</span></FormLabel>
                              <FormControl>
                                <Input {...field} className="rounded-none" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`additional_locations.${index}.state`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-lg">State <span className="text-gray-300/80 text-base font-normal">(required)</span></FormLabel>
                              <FormControl>
                                <Input {...field} className="rounded-none" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`additional_locations.${index}.zip_code`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-lg">ZIP Code <span className="text-gray-300/80 text-base font-normal">(required)</span></FormLabel>
                              <FormControl>
                                <Input {...field} className="rounded-none" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name={`additional_locations.${index}.phone`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-lg">Phone</FormLabel>
                            <FormControl>
                              <Input
                                inputMode="numeric"
                                value={field.value ?? ""}
                                onChange={(event) =>
                                  field.onChange(toTenDigits(event.target.value))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`additional_locations.${index}.email`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-lg">Email</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}

                <p className="text-gray-300/80 text-sm">
                  Need more than 5 locations?{" "}
                  <Link href="/contact" className="underline">
                    Contact us
                  </Link>
                  .
                </p>
              </section>
            )}

            <section className="space-y-4">
              <div className="space-y-6">
                <Controller
                  name="type_of_business"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <FieldSet
                      data-invalid={fieldState.invalid}
                      className="**:data-[slot=radio-group-item]:border-white **:data-[slot=radio-group-item]:bg-transparent [&_[data-slot=radio-group-item][data-state=checked]]:[&_svg]:fill-black **:data-[slot=field]:border-0 **:data-[slot=field]:p-0 **:data-[slot=field]:rounded-none"
                    >
                      <FieldLegend variant="label" className="text-lg! text-white font-medium mb-4">
                        Where can customers access your products or services? <span className="text-gray-300/80 text-base font-normal">(required)</span>
                      </FieldLegend>
                      <RadioGroup
                        name={field.name}
                        value={field.value}
                        onValueChange={field.onChange}
                        aria-invalid={fieldState.invalid}
                        className="space-y-4"
                      >
                        <FieldLabel htmlFor="type-of-business-physical">
                          <Field orientation="horizontal">
                            <RadioGroupItem
                              id="type-of-business-physical"
                              value="physical"
                              aria-invalid={fieldState.invalid}
                            />
                            <FieldContent>
                              <FieldDescription className="text-white font-normal">
                                Physical Location
                              </FieldDescription>
                            </FieldContent>
                          </Field>
                        </FieldLabel>
                        <FieldLabel htmlFor="type-of-business-online">
                          <Field orientation="horizontal">
                            <RadioGroupItem
                              id="type-of-business-online"
                              value="online"
                              aria-invalid={fieldState.invalid}
                            />
                            <FieldContent>
                              <FieldDescription className="text-white font-normal">
                                Online
                              </FieldDescription>
                            </FieldContent>
                          </Field>
                        </FieldLabel>
                        <FieldLabel htmlFor="type-of-business-both">
                          <Field orientation="horizontal">
                            <RadioGroupItem
                              id="type-of-business-both"
                              value="both"
                              aria-invalid={fieldState.invalid}
                            />
                            <FieldContent>
                              <FieldDescription className="text-white font-normal">
                                Both
                              </FieldDescription>
                            </FieldContent>
                          </Field>
                        </FieldLabel>
                      </RadioGroup>
                      <FieldError errors={[fieldState.error]} />
                    </FieldSet>
                  )}
                />

                <Controller
                  name="is_usa_based"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <FieldSet
                      data-invalid={fieldState.invalid}
                      className="**:data-[slot=checkbox]:bg-white **:data-[slot=checkbox]:border-gray-300"
                    >
                      <FieldLegend variant="label" className="text-lg! text-white font-medium mb-4">
                        My business is located in the U.S. <span className="text-gray-300/80 text-base font-normal">(required)</span>
                      </FieldLegend>
                      <FieldGroup data-slot="checkbox-group" className="gap-4">
                        <Field orientation="horizontal" data-invalid={fieldState.invalid}>
                          <Checkbox
                            id="is-usa-based"
                            name={field.name}
                            checked={field.value}
                            aria-invalid={fieldState.invalid}
                            onCheckedChange={(checked) =>
                              field.onChange(checked === true)
                            }
                          />
                          <FieldLabel
                            htmlFor="is-usa-based"
                            className="font-normal text-white text-lg"
                          >
                            Confirm
                          </FieldLabel>
                        </Field>
                      </FieldGroup>
                      <FieldError errors={[fieldState.error]} />
                    </FieldSet>
                  )}
                />

                <Controller
                  name="consent_marketing"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <FieldSet
                      data-invalid={fieldState.invalid}
                      className="**:data-[slot=checkbox]:bg-white **:data-[slot=checkbox]:border-gray-300"
                    >
                      <FieldLegend variant="label" className="text-lg! text-white font-medium mb-4">
                        I consent to be featured on BlackLight® marketing channels. <span className="text-gray-300/80 text-base font-normal">(required)</span>
                      </FieldLegend>
                      <FieldGroup data-slot="checkbox-group" className="gap-4">
                        <Field orientation="horizontal" data-invalid={fieldState.invalid}>
                          <Checkbox
                            id="consent-marketing-yes"
                            checked={field.value === true}
                            aria-invalid={fieldState.invalid}
                            onCheckedChange={() => field.onChange(true)}
                          />
                          <FieldLabel
                            htmlFor="consent-marketing-yes"
                            className="font-normal text-white text-lg"
                          >
                            Yes!
                          </FieldLabel>
                        </Field>
                        <Field orientation="horizontal" data-invalid={fieldState.invalid}>
                          <Checkbox
                            id="consent-marketing-no"
                            checked={field.value === false}
                            aria-invalid={fieldState.invalid}
                            onCheckedChange={() => field.onChange(false)}
                          />
                          <FieldLabel
                            htmlFor="consent-marketing-no"
                            className="font-normal text-white text-lg"
                          >
                            No, thanks.
                          </FieldLabel>
                        </Field>
                      </FieldGroup>
                      <FieldError errors={[fieldState.error]} />
                    </FieldSet>
                  )}
                />
              </div>
            </section>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button type="submit" className="text-black hover:opacity-80 bg-white px-8 py-4 rounded-lg" form={FORM_ID} disabled={submitMutation.isPending}>
          {submitMutation.isPending ? "Submitting..." : "Submit"}
        </Button>
      </CardFooter>
    </Card>
  );
}
