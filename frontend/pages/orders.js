/* eslint-disable react/prop-types */
import { useQuery } from '@apollo/client';
import gql from 'graphql-tag';
import Head from 'next/head';
import styled from 'styled-components';
import Link from 'next/link';
import OrderItemStyles from '../components/styles/OrderItemStyles';
import DisplayError from '../components/DisplayError';
import formatMoney from '../lib/formatMoney';
import { CURRENT_USER_QUERY } from '../components/User';

const USER_ORDERS_QUERY = gql`
  query USER_ORDERS_QUERY {
    #only the order the user need to see itself
    # filter it down that they should just see not the where id ==id or what
    # when we get into permission
    allOrders {
      id
      charge
      total
      user {
        id
      }
      items {
        id
        name
        description
        price
        quantity
        photo {
          image {
            publicUrlTransformed
          }
        }
      }
    }
  }
`;
const OrderUl = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  grid-gap: 4rem;
`;
// count items in an order
function countItemsInAnOrder(order) {
  return order.items.reduce((tally, item) => tally + item.quantity, 0);
}
export default function OrdersPage() {
  const { data, loading, error } = useQuery(USER_ORDERS_QUERY, {
    refetchQueries: [{ query: CURRENT_USER_QUERY }],
  });
  if (loading) return <p>Loading...</p>;
  if (error) return <DisplayError error={error} />;
  const { allOrders } = data;
  return (
    <div>
      <Head>
        <title>Your Orders ({allOrders.length})</title>
      </Head>
      <h2>You have {allOrders.length} orders!</h2>
      <OrderUl>
        {allOrders.map((order) => (
          <OrderItemStyles>
            {/* //click here and you will at the order single page  */}
            <Link href={`/order/${order.id}`}>
              <a>
                <div className="order-meta">
                  <p>{countItemsInAnOrder(order)} Items</p>
                  <p>
                    {order.items.length} Product
                    {order.items.length === 1 ? '' : 's'}
                  </p>
                  <p>{formatMoney(order.total)}</p>
                </div>
                {/* //for all the images in the order */}
                <div className="images">
                  {order.items.map((item) => (
                    <img
                      key={`image-${item.id}`}
                      src={item.photo?.image?.publicUrlTransformed}
                      alt={item.name}
                    />
                  ))}
                </div>
              </a>
            </Link>
          </OrderItemStyles>
        ))}
      </OrderUl>
    </div>
  );
}
