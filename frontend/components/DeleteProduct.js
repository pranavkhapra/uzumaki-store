import { useMutation } from '@apollo/client';
import gql from 'graphql-tag';

/* eslint-disable react/prop-types */
const DELETE_PRODUCT_MUTATION = gql`
  mutation DELETE_PRODUCT_MUTATION($id: ID!) {
    deleteProduct(id: $id) {
      id
      name
    }
  }
`;
// payload is what will contain the id and the name of the item
function update(cache, payload) {
  // cache identify identity where the item is and cache evict will delete it
  cache.evict(cache.identify(payload.data.deleteProduct));
}
export default function DeleteProduct({ id, children }) {
  const [deleteProduct, { loading, error }] = useMutation(
    DELETE_PRODUCT_MUTATION,
    {
      variables: {
        id,
      },
      update,
    }
  );
  return (
    <>
      <button
        type="button"
        disabled={loading}
        onClick={() => {
          if (
            window.confirm(
              'Are you sure you want to delete this item or this is a bad day'
            )
          ) {
            deleteProduct().catch((error) => alert(error.message));
          }
        }}
      >
        {children}
      </button>
    </>
  );
}
