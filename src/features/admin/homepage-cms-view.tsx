"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActionLoadingOverlay } from "@/components/shared/action-loading-overlay";
import type {
  HomepageCmsPayload,
  HomepageFeatureDto,
  HomepageServiceDto,
  HomepageTestimonialDto
} from "@/types/homepage";

const ICON_OPTIONS = ["bolt", "shield", "trending-up", "smartphone"] as const;
const COLOR_OPTIONS = ["mtn", "telecel"] as const;

function sectionByKey(data: HomepageCmsPayload, key: string) {
  return data.sections.find((s) => s.key === key);
}

export function HomepageCmsView() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<HomepageCmsPayload | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/homepage");
      if (!res.ok) throw new Error("load failed");
      const json = (await res.json()) as HomepageCmsPayload;
      setData(json);
    } catch {
      toast.error("Could not load homepage CMS");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!data) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/homepage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sections: data.sections,
          features: data.featuresAll,
          services: data.servicesAll,
          testimonials: data.testimonialsAll,
          stats: data.statsEditable
        })
      });
      if (!res.ok) throw new Error("save failed");
      const json = (await res.json()) as HomepageCmsPayload;
      setData(json);
      toast.success("Homepage saved");
    } catch {
      toast.error("Could not save homepage");
    } finally {
      setSaving(false);
    }
  };

  const updateSection = (key: string, field: "title" | "subtitle", value: string) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map((s) =>
          s.key === key ? { ...s, [field]: value } : s
        )
      };
    });
  };

  const updateFeature = (id: string, patch: Partial<HomepageFeatureDto>) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        featuresAll: prev.featuresAll.map((f) => (f.id === id ? { ...f, ...patch } : f))
      };
    });
  };

  const addFeature = () => {
    setData((prev) => {
      if (!prev) return prev;
      const next: HomepageFeatureDto = {
        id: crypto.randomUUID(),
        icon: "bolt",
        title: "New feature",
        description: "Describe this benefit.",
        color: "mtn",
        sortOrder: prev.featuresAll.length,
        published: true
      };
      return { ...prev, featuresAll: [...prev.featuresAll, next] };
    });
  };

  const removeFeature = (id: string) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        featuresAll: prev.featuresAll.filter((f) => f.id !== id)
      };
    });
  };

  const updateService = (id: string, patch: Partial<HomepageServiceDto>) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        servicesAll: prev.servicesAll.map((s) => (s.id === id ? { ...s, ...patch } : s))
      };
    });
  };

  const addService = () => {
    setData((prev) => {
      if (!prev) return prev;
      const next: HomepageServiceDto = {
        id: crypto.randomUUID(),
        name: "New service",
        emoji: "✨",
        brands: "Brands",
        network: "mtn",
        sortOrder: prev.servicesAll.length,
        published: true
      };
      return { ...prev, servicesAll: [...prev.servicesAll, next] };
    });
  };

  const removeService = (id: string) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        servicesAll: prev.servicesAll.filter((s) => s.id !== id)
      };
    });
  };

  const updateTestimonial = (id: string, patch: Partial<HomepageTestimonialDto>) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        testimonialsAll: prev.testimonialsAll.map((t) =>
          t.id === id ? { ...t, ...patch } : t
        )
      };
    });
  };

  const addTestimonial = () => {
    setData((prev) => {
      if (!prev) return prev;
      const next: HomepageTestimonialDto = {
        id: crypto.randomUUID(),
        name: "Customer name",
        city: "Accra",
        text: "Share a short quote.",
        rating: 5,
        sortOrder: prev.testimonialsAll.length,
        published: true
      };
      return { ...prev, testimonialsAll: [...prev.testimonialsAll, next] };
    });
  };

  const removeTestimonial = (id: string) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        testimonialsAll: prev.testimonialsAll.filter((t) => t.id !== id)
      };
    });
  };

  if (loading || !data) {
    return (
      <div className="relative min-h-[320px]">
        <ActionLoadingOverlay active label="Loading homepage CMS…" />
      </div>
    );
  }

  const whySection = sectionByKey(data, "why_bundlehub");
  const servicesSection = sectionByKey(data, "services");
  const testimonialsSection = sectionByKey(data, "testimonials");
  const topAgentsSection = sectionByKey(data, "top_agents");

  return (
    <div className="relative space-y-6">
      <ActionLoadingOverlay active={saving} label="Saving homepage…" />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold sm:text-2xl">Homepage CMS</h1>
          <p className="text-sm text-muted-foreground">
            Manage landing page content. Active shops ({data.stats.activeShops}) and average
            trust score ({data.stats.avgTrustScore}/100) update automatically from live shops.
          </p>
        </div>
        <Button variant="brand" onClick={save} disabled={saving}>
          <Save className="mr-1 h-4 w-4" />
          Save changes
        </Button>
      </div>

      <Card className="border-0 shadow-card dark:shadow-card-dark">
        <CardHeader>
          <CardTitle className="text-base">Live stats bar</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Orders processed</label>
            <Input
              type="number"
              min={0}
              value={data.statsEditable.ordersProcessed}
              onChange={(e) =>
                setData((prev) =>
                  prev
                    ? {
                        ...prev,
                        statsEditable: {
                          ...prev.statsEditable,
                          ordersProcessed: Number(e.target.value) || 0
                        }
                      }
                    : prev
                )
              }
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Platform revenue (GHS)</label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={data.statsEditable.platformRevenueGhs}
              onChange={(e) =>
                setData((prev) =>
                  prev
                    ? {
                        ...prev,
                        statsEditable: {
                          ...prev.statsEditable,
                          platformRevenueGhs: Number(e.target.value) || 0
                        }
                      }
                    : prev
                )
              }
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Active shops</label>
            <Input value={data.stats.activeShops} disabled />
            <p className="mt-1 text-xs text-muted-foreground">From approved shops in Neon</p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Avg trust score</label>
            <Input value={`${data.stats.avgTrustScore}/100`} disabled />
            <p className="mt-1 text-xs text-muted-foreground">Average of active shop trust scores</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="why">
        <TabsList className="flex h-auto flex-wrap gap-1">
          <TabsTrigger value="why">Why BundleHub</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="testimonials">Loved across Ghana</TabsTrigger>
          <TabsTrigger value="top">Top agents heading</TabsTrigger>
        </TabsList>

        <TabsContent value="why" className="mt-4 space-y-4">
          <Card className="border-0 shadow-card dark:shadow-card-dark">
            <CardHeader>
              <CardTitle className="text-base">Section heading</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Title</label>
                <Input
                  value={whySection?.title ?? ""}
                  onChange={(e) => updateSection("why_bundlehub", "title", e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Subtitle</label>
                <Input
                  value={whySection?.subtitle ?? ""}
                  onChange={(e) => updateSection("why_bundlehub", "subtitle", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {data.featuresAll.map((feature, index) => (
            <Card key={feature.id || `new-feature-${index}`} className="border-0 shadow-card dark:shadow-card-dark">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">Feature {index + 1}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFeature(feature.id)}
                  >
                    <Trash2 className="h-4 w-4 text-telecel" />
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium">Title</label>
                    <Input
                      value={feature.title}
                      onChange={(e) => updateFeature(feature.id, { title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium">Icon</label>
                    <select
                      className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                      value={feature.icon}
                      onChange={(e) =>
                        updateFeature(feature.id, {
                          icon: e.target.value as HomepageFeatureDto["icon"]
                        })
                      }
                    >
                      {ICON_OPTIONS.map((icon) => (
                        <option key={icon} value={icon}>
                          {icon}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium">Description</label>
                  <Input
                    value={feature.description}
                    onChange={(e) =>
                      updateFeature(feature.id, { description: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium">Color</label>
                    <select
                      className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                      value={feature.color}
                      onChange={(e) =>
                        updateFeature(feature.id, {
                          color: e.target.value as HomepageFeatureDto["color"]
                        })
                      }
                    >
                      {COLOR_OPTIONS.map((color) => (
                        <option key={color} value={color}>
                          {color}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium">Sort order</label>
                    <Input
                      type="number"
                      value={feature.sortOrder}
                      onChange={(e) =>
                        updateFeature(feature.id, { sortOrder: Number(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <label className="flex items-end gap-2 pb-2 text-sm">
                    <input
                      type="checkbox"
                      checked={feature.published}
                      onChange={(e) =>
                        updateFeature(feature.id, { published: e.target.checked })
                      }
                    />
                    Published
                  </label>
                </div>
              </CardContent>
            </Card>
          ))}
          <Button type="button" variant="outline" onClick={addFeature}>
            <Plus className="mr-1 h-4 w-4" />
            Add feature
          </Button>
        </TabsContent>

        <TabsContent value="services" className="mt-4 space-y-4">
          <Card className="border-0 shadow-card dark:shadow-card-dark">
            <CardHeader>
              <CardTitle className="text-base">Section heading</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Title</label>
                <Input
                  value={servicesSection?.title ?? ""}
                  onChange={(e) => updateSection("services", "title", e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Subtitle</label>
                <Input
                  value={servicesSection?.subtitle ?? ""}
                  onChange={(e) => updateSection("services", "subtitle", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {data.servicesAll.map((service, index) => (
            <Card key={service.id || `new-service-${index}`} className="border-0 shadow-card dark:shadow-card-dark">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">Service {index + 1}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeService(service.id)}
                  >
                    <Trash2 className="h-4 w-4 text-telecel" />
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium">Name</label>
                    <Input
                      value={service.name}
                      onChange={(e) => updateService(service.id, { name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium">Emoji</label>
                    <Input
                      value={service.emoji}
                      onChange={(e) => updateService(service.id, { emoji: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium">Network slug</label>
                    <Input
                      value={service.network}
                      onChange={(e) => updateService(service.id, { network: e.target.value })}
                      placeholder="mtn, airtime, bills…"
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium">Brands line</label>
                    <Input
                      value={service.brands}
                      onChange={(e) => updateService(service.id, { brands: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium">Sort order</label>
                      <Input
                        type="number"
                        value={service.sortOrder}
                        onChange={(e) =>
                          updateService(service.id, { sortOrder: Number(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <label className="flex items-end gap-2 pb-2 text-sm">
                      <input
                        type="checkbox"
                        checked={service.published}
                        onChange={(e) =>
                          updateService(service.id, { published: e.target.checked })
                        }
                      />
                      Published
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <Button type="button" variant="outline" onClick={addService}>
            <Plus className="mr-1 h-4 w-4" />
            Add service card
          </Button>
        </TabsContent>

        <TabsContent value="testimonials" className="mt-4 space-y-4">
          <Card className="border-0 shadow-card dark:shadow-card-dark">
            <CardHeader>
              <CardTitle className="text-base">Section heading</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Title</label>
                <Input
                  value={testimonialsSection?.title ?? ""}
                  onChange={(e) => updateSection("testimonials", "title", e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Subtitle</label>
                <Input
                  value={testimonialsSection?.subtitle ?? ""}
                  onChange={(e) => updateSection("testimonials", "subtitle", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {data.testimonialsAll.map((testimonial, index) => (
            <Card
              key={testimonial.id || `new-testimonial-${index}`}
              className="border-0 shadow-card dark:shadow-card-dark"
            >
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">Testimonial {index + 1}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTestimonial(testimonial.id)}
                  >
                    <Trash2 className="h-4 w-4 text-telecel" />
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium">Name</label>
                    <Input
                      value={testimonial.name}
                      onChange={(e) => updateTestimonial(testimonial.id, { name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium">City</label>
                    <Input
                      value={testimonial.city}
                      onChange={(e) => updateTestimonial(testimonial.id, { city: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium">Rating (1–5)</label>
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      value={testimonial.rating}
                      onChange={(e) =>
                        updateTestimonial(testimonial.id, {
                          rating: Number(e.target.value) || 5
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium">Quote</label>
                  <Input
                    value={testimonial.text}
                    onChange={(e) => updateTestimonial(testimonial.id, { text: e.target.value })}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium">Sort order</label>
                    <Input
                      type="number"
                      value={testimonial.sortOrder}
                      onChange={(e) =>
                        updateTestimonial(testimonial.id, {
                          sortOrder: Number(e.target.value) || 0
                        })
                      }
                    />
                  </div>
                  <label className="flex items-end gap-2 pb-2 text-sm">
                    <input
                      type="checkbox"
                      checked={testimonial.published}
                      onChange={(e) =>
                        updateTestimonial(testimonial.id, { published: e.target.checked })
                      }
                    />
                    Published
                  </label>
                </div>
              </CardContent>
            </Card>
          ))}
          <Button type="button" variant="outline" onClick={addTestimonial}>
            <Plus className="mr-1 h-4 w-4" />
            Add testimonial
          </Button>
        </TabsContent>

        <TabsContent value="top" className="mt-4">
          <Card className="border-0 shadow-card dark:shadow-card-dark">
            <CardHeader>
              <CardTitle className="text-base">Top agents section</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Title</label>
                <Input
                  value={topAgentsSection?.title ?? ""}
                  onChange={(e) => updateSection("top_agents", "title", e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Subtitle</label>
                <Input
                  value={topAgentsSection?.subtitle ?? ""}
                  onChange={(e) => updateSection("top_agents", "subtitle", e.target.value)}
                />
              </div>
              <p className="sm:col-span-2 text-sm text-muted-foreground">
                Top agents are pulled automatically from active shops (featured first, then
                highest trust score). Edit shop trust scores from the Shops admin area.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
