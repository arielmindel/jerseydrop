import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import { getAllProducts, getProductBySlug, getRelatedProducts } from "@/lib/products";
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
  return {
    title: `${product.team} ${product.nameHe.split(" ").slice(1).join(" ")}`,
    description: `${product.nameHe} · ${product.season} · גרסת Fan ${product.priceFan} ₪, Player ${product.pricePlayer} ₪.`,
    openGraph: {
      title: `${product.team} · ${product.season}`,
      description: product.nameHe,
      images: [{ url: product.images[0], width: 800, height: 1000 }],
    },
  };
}

export default function ProductPage({ params }: Props) {
  const product = getProductBySlug(params.slug);
  if (!product) notFound();
  const related = getRelatedProducts(product, 6);

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.nameHe,
    alternateName: product.nameEn,
    image: product.images,
    description: `${product.nameHe} · ${product.season}`,
    brand: { "@type": "Brand", name: "JerseyDrop" },
    offers: {
      "@type": "Offer",
      priceCurrency: "ILS",
      price: product.priceFan,
      availability:
        product.stock === "preorder"
          ? "https://schema.org/PreOrder"
          : "https://schema.org/InStock",
    },
  };

  return (
    <>
      <JsonLd data={productLd} />
      <nav className="container pt-6 text-xs text-muted">
        <Link
          href={
            product.league
              ? `/leagues/${product.league}`
              : product.nation
                ? `/nations/${product.nation}`
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
