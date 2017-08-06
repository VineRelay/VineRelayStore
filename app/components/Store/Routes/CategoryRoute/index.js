import React from 'react';
import styled from 'styled-components';
import { withRouter } from 'react-router';
import { createFragmentContainer, QueryRenderer, graphql } from 'react-relay';
import relayEnvironment from 'app/config/relay';
import PageError from 'app/components/Common/PageError';
import PageLoader from 'app/components/Common/PageLoader';
import StoreLayout from 'app/components/Store/Main/StoreLayout';
import CategoryHeader from 'app/components/Store/Category/CategoryHeader';
import CategoryHero from 'app/components/Store/Category/CategoryHero';
import ProductsGrid from 'app/components/Store/Product/ProductsGrid';
import AdminFooter from 'app/components/Store/Main/AdminFooter';
import Button from 'app/components/Store/Main/Button';
import Paper from 'app/components/Store/Main/Paper';
import { cartActions } from 'app/actions';
import { cartStore } from 'app/stores';

const SmallDivider = styled.div`
  width: 100px;
  height: 1px;
  background: #000;
  opacity: 0.1;
  margin: 0 auto;
`;

class CategoryRoute extends React.Component {

  componentWillMount() {
    this.cartListener = cartStore.addListener(() => {
      this.forceUpdate();
    });
  }

  componentWillUnmount() {
    this.cartListener.remove();
  }

  isProductInCart = (product) => {
    return cartStore.hasItem(product.id);
  }

  onAddToCartClick = (product) => {
    if(cartStore.hasItem(product.id)) {
      cartActions.removeItem(product.id);
    } else {
      // Add product to cart
      cartActions.addItem(
        product.id,
        1, // Quantity
        product.price,
        product.name,
        product.mainImage
      );
    }
  }

  render() {
    const {
      node: category,
      viewer,
      products,
      history,
      notifier,
    } = this.props;

    return (
      <StoreLayout
        notifier={notifier}
        viewer={viewer}
        adminFooterContent={
          <Button
            primary
            onClick={() => history.push(`/admin/category/${category.id}`)}
          >
            Edit category
          </Button>
        }
      >
        <CategoryHero
          category={category}
        />
        {
          category.description &&
          <Paper paddings={[ 'top', 'left', 'right' ]}>
            <p>{category.description}</p>
            <SmallDivider />
          </Paper>
        }
        <Paper paddings={[ 'top', 'bottom', 'left', 'right' ]}>
          <ProductsGrid
            products={products}
            onProductClick={(id) => history.push(`/product/${id}`)}
            onAddToCartClick={this.onAddToCartClick}
            isProductInCart={this.isProductInCart}
          />
        </Paper>
      </StoreLayout>
    );
  }
}

export default (props) => (
  <QueryRenderer
    environment={relayEnvironment}
    query={graphql`
      query CategoryRouteQuery($categoryId: ID!) {
        node(id: $categoryId) {
          id
          ... on Category {
            description
          }
          ...CategoryHero_category
          ...CategoryHeader_category
        }

        products(categoryId: $categoryId) {
          ...ProductsGrid_products
        }

        notifier {
          ...StoreLayout_notifier
        }

        viewer {
          ...StoreLayout_viewer
        }
      }
    `}
    variables={{
      categoryId: props.match.params.categoryId,
    }}
    render={({ error, props: relayProps }) => {
      if (error) {
        return <PageError error={error} />;
      }

      if (relayProps) {
        return (
          <CategoryRoute {...props} {...relayProps} />
        );
      }

      return <PageLoader />;
    }}
  />
);
