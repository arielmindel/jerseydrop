import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import {
  getAllProducts,
  getProductBySlug,
  getRelatedProducts,
  getStartingPrice,
} from "@/lib/products";
import { descriptionParagraphs } from "@/lib/sanitize";
import ProductDetailV2 from "@/components/product/ProductDetailV2";
import RelatedProducts from "@/components/product/RelatedProducts";
import JsonLd from "@/components/seo/JsonLd";
import { SITE_URL } from "@/lib/constants";

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return getAllProducts().map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const product = getProductBySlug(params.slug);
  if (!product) return { title: "חולצה לא נמצאה" };
  const summary = descriptionParagraphs(product.description)[0]?.slice(0, 160);
  const seasonChip = product.season ? ` · ${product.season}` : "";
  const priceChip = ` · ${getStartingPrice(product) ?? 119} ₪`;
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
    alternates: { canonical: `${SITE_URL}/products/${product.slug}` },
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
    // Reused inside both tiers of shippingDetails below — 1-3 business days
    // handling + 10-16 days transit from the supplier.
    const deliveryTime = {
      "@type": "ShippingDeliveryTime",
      handlingTime: {
        "@type": "QuantitativeValue",
        minValue: 1,
        maxValue: 3,
        unitCode: "DAY",
      },
      transitTime: {
        "@type": "QuantitativeValue",
        minValue: 10,
        maxValue: 16,
        unitCode: "DAY",
      },
    };
    const shippingDestination = {
      "@type": "DefinedRegion",
      addressCountry: "IL",
    };

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
      url: `${SITE_URL}/products/${product.slug}`,
      // Two-tier shipping: flat 25 ILS up to 199.99, free at 200+. Google
      // supports an array of OfferShippingDetails so the eligibility band
      // (PriceSpecification.min/maxPrice) tells the SERP which rate applies
      // to a given order subtotal.
      shippingDetails: [
        {
          "@type": "OfferShippingDetails",
          shippingRate: {
            "@type": "MonetaryAmount",
            value: "25",
            currency: "ILS",
          },
          shippingDestination,
          eligibleTransactionVolume: {
            "@type": "PriceSpecification",
            maxPrice: 199.99,
            priceCurrency: "ILS",
          },
          deliveryTime,
        },
        {
          "@type": "OfferShippingDetails",
          shippingRate: {
            "@type": "MonetaryAmount",
            value: "0",
            currency: "ILS",
          },
          shippingDestination,
          eligibleTransactionVolume: {
            "@type": "PriceSpecification",
            minPrice: 200,
            priceCurrency: "ILS",
          },
          deliveryTime,
        },
      ],
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "IL",
        returnPolicyCategory:
          "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 14,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
      },
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
        item: SITE_URL,
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
            ? `${SITE_URL}/nations`
            : `${SITE_URL}/leagues`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.team,
        item:
          product.category === "national"
            ? `${SITE_URL}/nations/${product.teamSlug}`
            : `${SITE_URL}/leagues/${product.league}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: product.nameHe,
        item: `${SITE_URL}/products/${product.slug}`,
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
      <ProductDetailV2 product={product} />
      <RelatedProducts products={related} />
    </>
  );
}
