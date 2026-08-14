import {Await, useLoaderData, Link} from 'react-router';
import type {Route} from './+types/_index';
import {Suspense} from 'react';
import {Image} from '@shopify/hydrogen';
import type {
  FeaturedCollectionFragment,
  RecommendedProductsQuery,
} from 'storefrontapi.generated';
import {ProductItem} from '~/components/ProductItem';
import {MockShopNotice} from '~/components/MockShopNotice';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Gharana | Pure pantry, delivered'}];
};

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  return {...deferredData, ...criticalData};
}

async function loadCriticalData({context}: Route.LoaderArgs) {
  const [{collections}] = await Promise.all([
    context.storefront.query(FEATURED_COLLECTION_QUERY),
  ]);

  return {
    isShopLinked: Boolean(context.env.PUBLIC_STORE_DOMAIN),
    collections: collections.nodes,
    featuredCollection: collections.nodes[0],
  };
}

function loadDeferredData({context}: Route.LoaderArgs) {
  const recommendedProducts = context.storefront
    .query(RECOMMENDED_PRODUCTS_QUERY)
    .catch((error: Error) => {
      console.error(error);
      return null;
    });

  return {recommendedProducts};
}

export default function Homepage() {
  const data = useLoaderData<typeof loader>();
  return (
    <div className="home">
      {data.isShopLinked ? null : <MockShopNotice />}
      <HomeDeliveryStrip />
      <PromoRail />
      <CategorySection collections={data.collections} />
      <OfferStrip />
      <RecommendedProducts products={data.recommendedProducts} />
      <Benefits />
    </div>
  );
}

function HomeDeliveryStrip() {
  return (
    <section className="home-delivery-strip">
      <div className="delivery-copy">
        <span className="delivery-label">DELIVERY IN</span>
        <strong>28 minutes</strong>
        <button type="button" className="location-button">
          Home · Bengaluru 560001
        </button>
      </div>
      <Link className="home-search-bar" to="/search">
        Search for atta, dal, ghee…
      </Link>
    </section>
  );
}

function PromoRail() {
  return (
    <section className="promo-rail">
      <Link className="expo-promo promo-orange" to="/collections">
        <div>
          <span>GHARANA QUALITY</span>
          <strong>
            Pure pantry,
            <br />
            delivered fast.
          </strong>
          <b>SHOP NOW</b>
        </div>
        <i>✦</i>
      </Link>
      <Link className="expo-promo promo-green" to="/collections">
        <div>
          <span>NEVER RUN OUT</span>
          <strong>
            Weekly staples,
            <br />
            sorted.
          </strong>
          <b>SET A PLAN</b>
        </div>
        <i>↻</i>
      </Link>
    </section>
  );
}

function CategorySection({
  collections,
}: {
  collections: FeaturedCollectionFragment[];
}) {
  return (
    <section className="expo-section">
      <SectionHeader title="Shop by category" action="See all" />
      <div className="category-grid">
        {collections.slice(0, 8).map((collection) => (
          <Link
            key={collection.id}
            to={`/collections/${collection.handle}`}
            className="category-tile"
          >
            <div>
              {collection.image ? (
                <Image
                  data={collection.image}
                  alt={collection.image.altText || collection.title}
                />
              ) : null}
            </div>
            <span>{collection.title}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function OfferStrip() {
  return (
    <div className="offer-strip">
      <b>%</b>
      <div>
        <strong>₹100 off on your first pantry order</strong>
        <span>Use code FIRSTBOX above ₹499</span>
      </div>
    </div>
  );
}

function Benefits() {
  return (
    <section className="home-benefits">
      <div>
        <b>◈</b>
        <strong>Lab tested</strong>
        <span>Every batch</span>
      </div>
      <div>
        <b>↻</b>
        <strong>Easy returns</strong>
        <span>No questions</span>
      </div>
      <div>
        <b>⌁</b>
        <strong>Fast delivery</strong>
        <span>At your door</span>
      </div>
    </section>
  );
}

function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {action ? (
        <Link to="/collections">
          {action} ›
        </Link>
      ) : null}
    </div>
  );
}

function RecommendedProducts({
  products,
}: {
  products: Promise<RecommendedProductsQuery | null>;
}) {
  return (
    <section className="recommended-products">
      <SectionHeader
        title="Bestsellers near you"
        subtitle="Loved by Gharana homes"
      />
      <Suspense fallback={<p>Loading products…</p>}>
        <Await resolve={products}>
          {(response) => (
            <div className="products-scroll recommended-products-grid">
              {response
                ? response.products.nodes.map((product) => (
                    <ProductItem key={product.id} product={product} />
                  ))
                : null}
            </div>
          )}
        </Await>
      </Suspense>
    </section>
  );
}

const FEATURED_COLLECTION_QUERY = `#graphql
  fragment FeaturedCollection on Collection {
    id
    title
    image {
      id
      url
      altText
      width
      height
    }
    handle
  }
  query FeaturedCollection($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 8, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...FeaturedCollection
      }
    }
  }
` as const;

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  fragment RecommendedProduct on Product {
    id
    title
    handle
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    featuredImage {
      id
      url
      altText
      width
      height
    }
    selectedOrFirstAvailableVariant {
      id
      availableForSale
      title
    }
  }
  query RecommendedProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 8, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...RecommendedProduct
      }
    }
  }
` as const;
