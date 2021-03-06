/* eslint-disable */

import { KeystoneContext, SessionStore } from '@keystone-next/types';
import {
  CartItemCreateInput,
  OrderCreateInput,
} from '../.keystone/schema-types';
import stripeConfig from '../lib/stripe';
import { CartItem } from '../schemas/CartItem';

// fake when we need to get the higlighting thing
const graphql = String.raw;
interface Arguments {
  token: string;
}
// when you run the checkout mutation with token you will get the things the user and all
async function checkout(
  root: any,
  // the 2 argument give me the token of string type
  { token }: Arguments,
  context: KeystoneContext
): Promise<OrderCreateInput> {
  // 1.Make sure they are signed in
  const userId = context.session.itemId;
  if (!userId) {
    throw new Error('Sorry! You must be signed in to create an order!');
  }
  // 1.5 query the current user also with that you can get the order total price
  const user = await context.lists.User.findOne({
    where: { id: userId },
    resolveFields: graphql`
          id
          name
          email
          cart {
            id
            quantity
            product {
              name
              price
              description
              id
              photo {
                id
                image {
                  id
                  publicUrlTransformed
                }
              }
            }
          }
        `,
  });
  // console.dir(user, { depth: null });

  // 2.calculate the total price for their order
  // like if we have a order but not having a product like nike shoes i have order
  // but now they are not as a product anymore
  const cartItems = user.cart.filter(cartItem => cartItem.product);
  // console.log(cartItems)
  const amount = cartItems.reduce(function(tally: number, cartItem: CartItemCreateInput) {
    return tally + cartItem.quantity * cartItem.product.price;
  }, 0);
  // console.log(cartItems.product)
  // const description = cartItems.map(function(cartItem: CartItemCreateInput) {
  //   return cartItem.product.
  // }, 0);
  // console.log(amount)
  // 3.create the payment with the stripe library and go ahead charge that
  const charge=await stripeConfig.paymentIntents.create({ 
    amount,
    // customerName:'Testing Name',
    // address:"KonohaVillage",
    // description:'Strings Workshop Payment by Tester',
    // name="testingCustomer",
    // description="Basically just testing things.... ",
    currency:'USD',
    //charge the card immediately
    confirm:true,
    //comes form frontend when we use mutation
    payment_method:token
  }).catch(err => {
    console.log(err);
    throw new Error(err.message);
  });
  // console.log(charge)
  // 4.convert the cart item into order item
  //the items in the user cart will  be now its order which he has order
  // for each cart item we have a object order item
  const orderItems = cartItems.map(cartItem => {
    //the order item is the order schema here we are creating
    const orderItem = {
      name: cartItem.product.name,
      description: cartItem.product.description,
      price: cartItem.product.price,
      quantity: cartItem.quantity,
      //connect relation ship with the photo
      photo: { connect: { id: cartItem.product.photo.id }},
    }
    return orderItem;
  })
  // 5.create the order and save it
  //now we have orderItems so we will create it
  const order = await context.lists.Order.createOne({
    data: {
      total: charge.amount,
      charge: charge.id,
      //relationship with orderItems 
      items: { create: orderItems },
      user: { connect: { id: userId }}
    },
    resolveFields: false,
  });

  //6 Clean up any old cart item
  //we create  the id 
  const cartItemIds = user.cart.map(cartItem => cartItem.id);
    //now we are deleting it to delete from the cart item
  await context.lists.CartItem.deleteMany({
    ids:cartItemIds
  });
  return order;
}

export default checkout;





