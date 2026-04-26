import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import {
  getAllProducts,
  getProductBySlug,
  getRelatedProducts,
  getStartingPrice,
  hasPrice,
} from "@/lib/products";
import { descriptionParagraphs } from "@/lib/sanitize";
import ProductDetail from "@/components/product/ProductDetail";
import RelatedProducts from "@/components/product/RelatedProducts";
import JsonLd from "@/components/seo/JsonLd";

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return getAllProducts().map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const product = getProductBySlug(params.slug);
  if (!product) return { title: "חולצה לא נמצאה" };
  const summary = descriptionParagraphs(product.description)[0]?.slice(0, 160);
  const seasonChip = product.season ? ` · ${product.season}` : "";
  const priceChip = hasPrice(product)
    ? ` · החל מ-${getStartingPrice(product)} ₪`
    : "";
  return {
    title: `${product.team || product.nameHe}${seasonChip}`,
    description:
      summary ||
      `${product.nameHe}${seasonChip}${priceChip} | משלוח לכל הארץ.`,
    openGraph: {
      title: `${product.team || product.nameHe}${seasonChip}`,
      description: product.nameHe,
      images: product.images?.length
        ? [{ url: product.images[0], width: 800, height: 1000 }]
        : undefined,
      type: "website",
    },
    alternates: { canonical: `https://jerseydrop.co.il/products/${product.slug}` },
  };
}

export default function ProductPage({ params }: Props) {
  const product = getProductBySlug(params.slug);
  if (!product) notFound();
  const related = getRelatedProducts(product, 6);

  const startingPrice = getStartingPrice(product);
  const productLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.nameHe,
    sku: product.id,
    image: product.images,
    description:
      descriptionParagraphs(product.description).join(" ").slice(0, 500) ||
      `${product.nameHe}${product.season ? ` · ${product.season}` : ""}`,
    brand: { "@type": "Brand", name: "JerseyDrop" },
    category: product.category === "national" ? "National Team Jersey" : "Club Jersey",
  };
  if (product.nameEn) productLd.alternateName = product.nameEn;

  // Only include offers when we have a real price; Google rejects offers
  // without a numeric price.
  if (startingPrice !== null) {
    productLd.offers = {
      "@type": "Offer",
      priceCurrency: "ILS",
      price: startingPrice,
      availability:
        product.stock === "preorder"
          ? "https://schema.org/PreOrder"
          : product.stock === "low"
            ? "https://schema.org/LimitedAvailability"
            : "https://schema.org/InStock",
      url: `https://jerseydrop.co.il/products/${product.slug}`,
    };
  }

  // Breadcrumb structured data
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "JerseyDrop",
        item: "https://jerseydrop.co.il",
      },
      {
        "@type": "ListItem",
        position: 2,
        name:
          product.category === "national"
            ? "נבחרות"
            : "מועדונים",
        item:
          product.category === "national"
            ? "https://jerseydrop.co.il/nations"
            : "https://jerseydrop.co.il/leagues",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.team,
        item:
          product.category === "national"
            ? `https://jerseydrop.co.il/nations/${product.teamSlug}`
            : `https://jerseydrop.co.il/leagues/${product.league}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: product.nameHe,
        item: `https://jerseydrop.co.il/products/${product.slug}`,
      },
    ],
  };

  return (
    <>
      <JsonLd data={productLd} />
      <JsonLd data={breadcrumbLd} />
      <nav className="container pt-6 text-xs text-muted">
        <Link
          href={
            product.category === "national"
              ? `/nations/${product.teamSlug}`
              : product.league
                ? `/leagues/${product.league}`
                : "/products"
          }
          className="inline-flex items-center gap-1 hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          חזרה
        </Link>
      </nav>
      <ProductDetail product={product} />
      <RelatedProducts products={related} />
    </>
  );
}
