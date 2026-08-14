import {Await} from 'react-router';
import {Money} from '@shopify/hydrogen';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from './Aside';

export function FloatingCartBar({
  cart,
}: {
  cart: Promise<CartApiQueryFragment | null>;
}) {
  const {open} = useAside();

  return (
    <Await resolve={cart}>
      {(resolvedCart) => {
        if (!resolvedCart?.totalQuantity) return null;
        return (
          <button
            type="button"
            className="floating-cart-bar"
            onClick={() => open('cart')}
            aria-label={`View cart, ${resolvedCart.totalQuantity} items`}
          >
            <span className="floating-cart-icon">⌑</span>
            <span className="floating-cart-copy">
              <strong>
                <Money data={resolvedCart.cost.totalAmount} />
              </strong>
              <small>
                {resolvedCart.totalQuantity} item
                {resolvedCart.totalQuantity === 1 ? '' : 's'} in cart
              </small>
            </span>
            <span className="floating-cart-action">View cart</span>
            <span className="floating-cart-chevron">›</span>
          </button>
        );
      }}
    </Await>
  );
}
