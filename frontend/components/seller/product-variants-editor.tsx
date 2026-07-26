'use client';

import { useMemo, useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export type ProductVariantInput = {
  attributes: Record<string, string>;
  stock: number;
  priceOverride?: number;
  sku?: string;
};

function cartesian<T>(lists: T[][]): T[][] {
  return lists.reduce<T[][]>(
    (acc, list) => acc.flatMap((prefix) => list.map((item) => [...prefix, item])),
    [[]],
  );
}

function variantKey(attributes: Record<string, string>) {
  return Object.keys(attributes)
    .sort()
    .map((k) => `${k}:${attributes[k]}`)
    .join('|');
}

type Props = {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  variants: ProductVariantInput[];
  onChange: (variants: ProductVariantInput[]) => void;
  basePrice?: number;
  initialColors?: string;
  initialSizes?: string;
};

export function ProductVariantsEditor({
  enabled,
  onEnabledChange,
  variants,
  onChange,
  basePrice,
  initialColors = '',
  initialSizes = '',
}: Props) {
  const [colorsText, setColorsText] = useState(initialColors);
  const [sizesText, setSizesText] = useState(initialSizes);

  useEffect(() => {
    if (initialColors) setColorsText(initialColors);
  }, [initialColors]);

  useEffect(() => {
    if (initialSizes) setSizesText(initialSizes);
  }, [initialSizes]);

  const colors = useMemo(
    () =>
      colorsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    [colorsText],
  );
  const sizes = useMemo(
    () =>
      sizesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    [sizesText],
  );

  const regenerateGrid = () => {
    if (!colors.length && !sizes.length) {
      onChange([]);
      return;
    }
    const dimensions: { key: string; values: string[] }[] = [];
    if (colors.length) dimensions.push({ key: 'color', values: colors });
    if (sizes.length) dimensions.push({ key: 'size', values: sizes });
    if (!dimensions.length) return;

    const combos = cartesian(dimensions.map((d) => d.values));
    const existing = new Map(variants.map((v) => [variantKey(v.attributes), v]));

    const next: ProductVariantInput[] = combos.map((combo) => {
      const attributes: Record<string, string> = {};
      combo.forEach((value, i) => {
        attributes[dimensions[i].key] = value;
      });
      const key = variantKey(attributes);
      const prev = existing.get(key);
      return {
        attributes,
        stock: prev?.stock ?? 0,
        priceOverride: prev?.priceOverride,
        sku: prev?.sku,
      };
    });
    onChange(next);
  };

  const updateRow = (index: number, patch: Partial<ProductVariantInput>) => {
    onChange(variants.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const labelFor = (attributes: Record<string, string>) =>
    Object.entries(attributes)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' · ');

  return (
    <Card className="border-gray-100 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-sm font-extrabold text-gray-700">Variants (optional)</CardTitle>
            <CardDescription className="text-xs">
              Color and size combinations with stock per option. Skip for single-SKU products.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="variants-toggle" className="text-xs text-muted-foreground">
              Use variants
            </Label>
            <Switch
              id="variants-toggle"
              checked={enabled}
              onCheckedChange={(on) => {
                onEnabledChange(on);
                if (!on) onChange([]);
              }}
            />
          </div>
        </div>
      </CardHeader>
      {enabled && (
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-600">Colors (comma-separated)</Label>
              <Input
                placeholder="Red, Blue, Black"
                value={colorsText}
                onChange={(e) => setColorsText(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-600">Sizes (comma-separated)</Label>
              <Input
                placeholder="S, M, L, XL"
                value={sizesText}
                onChange={(e) => setSizesText(e.target.value)}
              />
            </div>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={regenerateGrid}>
            <Plus className="mr-1 h-4 w-4" />
            Generate combinations
          </Button>

          {variants.length > 0 && (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="p-2 font-medium">Option</th>
                    <th className="p-2 font-medium">Stock</th>
                    <th className="p-2 font-medium">
                      Price override{basePrice != null ? ` (base ₹${basePrice})` : ''}
                    </th>
                    <th className="p-2 font-medium">SKU</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((row, index) => (
                    <tr key={variantKey(row.attributes)} className="border-t">
                      <td className="p-2 font-medium">{labelFor(row.attributes)}</td>
                      <td className="p-2">
                        <Input
                          type="number"
                          min={0}
                          className="h-8 w-20"
                          value={row.stock}
                          onChange={(e) =>
                            updateRow(index, { stock: Math.max(0, Number(e.target.value) || 0) })
                          }
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          className="h-8 w-24"
                          placeholder="Optional"
                          value={row.priceOverride ?? ''}
                          onChange={(e) => {
                            const v = e.target.value;
                            updateRow(index, {
                              priceOverride: v === '' ? undefined : Number(v),
                            });
                          }}
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          className="h-8"
                          placeholder="Optional"
                          value={row.sku ?? ''}
                          onChange={(e) => updateRow(index, { sku: e.target.value || undefined })}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {variants.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() => onChange([])}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Clear all variants
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  );
}

/** Hydrate color/size inputs from existing variant rows (edit form). */
export function inferVariantDimensionText(
  variants: ProductVariantInput[],
  dimension: 'color' | 'size',
): string {
  const values = new Set<string>();
  for (const v of variants) {
    const val = v.attributes[dimension];
    if (val) values.add(val);
  }
  return Array.from(values).join(', ');
}
