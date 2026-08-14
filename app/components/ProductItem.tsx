import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import {AddToCartButton} from './AddToCartButton';
import {useAside} from './Aside';
import type {
  ProductItemFragment,
  CollectionItemFragment,
  RecommendedProductFragment,
} from 'storefrontapi.generated';
import {useVariantUrl} from '~/lib/variants';

type ProductData =
  | CollectionItemFragment
  | ProductItemFragment
  | RecommendedProductFragment;

export function ProductItem({
  product,
  loading,
}: {
  product: ProductData;
  loading?: 'eager' | 'lazy';
}) {
  const variantUrl = useVariantUrl(product.handle);
  const image = product.featuredImage;
  const variant = (
    product as ProductData & {
      selectedOrFirstAvailableVariant?: {
        id: string;
        availableForSale: boolean;
        title?: string;
      };
    }
  ).selectedOrFirstAvailableVariant;
  const {open} = useAside();

  return (
    <article className="product-card">
      <Link className="product-card-link" prefetch="intent" to={variantUrl}>
        <div className="product-card-image">
          {image ? (
            <Image
              alt={image.altText || product.title}
              aspectRatio="1/1"
              data={image}
              loading={loading}
              sizes="(min-width: 48em) 240px, 46vw"
            />
          ) : (
            <div className="product-image-placeholder" />
          )}
          <span className="quality-badge">PURE</span>
        </div>
      </Link>
      <div className="product-card-body">
        <Link className="product-card-title" to={variantUrl}>
          {product.title}
        </Link>
        {variant?.title && variant.title !== 'Default Title' ? (
          <span className="product-card-variant">{variant.title}</span>
        ) : (
          <span className="product-card-variant">&nbsp;</span>
        )}
        <div className="product-card-footer">
          <span className="product-card-price">
            <Money data={product.priceRange.minVariantPrice} />
          </span>
          {variant ? (
            <AddToCartButton
              lines={[{merchandiseId: variant.id, quantity: 1}]}
              disabled={!variant.availableForSale}
              onClick={() => open('cart')}
            >
              <span className="btn-add">ADD</span>
            </AddToCartButton>
          ) : (
            <Link className="btn-add" to={variantUrl}>
              ADD
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
