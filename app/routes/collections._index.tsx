import {useLoaderData, Link} from 'react-router';
import type {Route} from './+types/collections._index';
import {getPaginationVariables, Image} from '@shopify/hydrogen';
import type {CollectionFragment} from 'storefrontapi.generated';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Gharana | Shop by category'}];
};

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  return {...deferredData, ...criticalData};
}

async function loadCriticalData({context, request}: Route.LoaderArgs) {
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 12,
  });

  const [{collections}] = await Promise.all([
    context.storefront.query(COLLECTIONS_QUERY, {
      variables: paginationVariables,
    }),
  ]);

  return {collections};
}

function loadDeferredData() {
  return {};
}

export default function Collections() {
  const {collections} = useLoaderData<typeof loader>();

  return (
    <div className="collections">
      <header className="page-intro">
        <p className="eyebrow">Gharana Pantry</p>
        <h1>Shop by category</h1>
        <p>
          Browse our curated collections of pure staples — from atta and dal to
          ghee and spices.
        </p>
      </header>

      <Link className="home-search-bar" to="/search" style={{marginBottom: '2rem', display: 'flex'}}>
        Search for atta, dal, ghee…
      </Link>

      <PaginatedResourceSection<CollectionFragment>
        connection={collections}
        resourcesClassName="collections-grid"
      >
        {({node: collection, index}) => (
          <CollectionCard collection={collection} index={index} />
        )}
      </PaginatedResourceSection>
    </div>
  );
}

function CollectionCard({
  collection,
  index,
}: {
  collection: CollectionFragment;
  index: number;
}) {
  return (
    <Link
      className="collection-card"
      to={`/collections/${collection.handle}`}
      prefetch="intent"
    >
      <div className="collection-card-image">
        {collection?.image ? (
          <Image
            alt={collection.image.altText || collection.title}
            aspectRatio="1.2/1"
            data={collection.image}
            loading={index < 4 ? 'eager' : undefined}
            sizes="(min-width: 48em) 300px, 46vw"
          />
        ) : (
          <div className="collection-image-placeholder" />
        )}
      </div>
      <div className="collection-card-copy">
        <h5>{collection.title}</h5>
        <span>Explore →</span>
      </div>
    </Link>
  );
}

const COLLECTIONS_QUERY = `#graphql
  fragment Collection on Collection {
    id
    title
    handle
    image {
      id
      url
      altText
      width
      height
    }
  }
  query StoreCollections(
    $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $startCursor: String
  ) @inContext(country: $country, language: $language) {
    collections(
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor
    ) {
      nodes {
        ...Collection
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
` as const;
