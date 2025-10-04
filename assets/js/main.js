(function ($) {
  const $body = $("body");
  const $header = $(".header");

  function closeMobileMenu() {
    const $mobileMenu = $(".mobile__menu");
    $mobileMenu.removeClass("open").attr("aria-hidden", "true");
    $body.removeClass("menu-open");
  }

  function initMobileNavigation() {
    const $toggleButton = $(".nav__toggle");
    const $mobileMenu = $(".mobile__menu");
    const $mobileMenuClose = $(".mobile__menu__close");

    if ($toggleButton.length && $mobileMenu.length) {
      $toggleButton.on("click", function () {
        const isOpen = $mobileMenu.toggleClass("open").hasClass("open");
        $mobileMenu.attr("aria-hidden", String(!isOpen));
        $body.toggleClass("menu-open", isOpen);
      });

      $mobileMenu.on("click", function (e) {
        if ($(e.target).is($mobileMenu)) {
          closeMobileMenu();
        }
      });
    }

    if ($mobileMenuClose.length) {
      $mobileMenuClose.on("click", closeMobileMenu);
    }
  }

  function initMobileDropdown() {
    $(".mobile__menu .dropdown > a").on("click", function (e) {
      e.preventDefault();
      const $dropdown = $(this).parent();
      const $dropdownContent = $dropdown.find(".dropdown_content");

      $(".mobile__menu .dropdown").not($dropdown).removeClass("active");
      $(".mobile__menu .dropdown_content").not($dropdownContent).slideUp();

      $dropdown.toggleClass("active");
      $dropdownContent.slideToggle();
    });

    $(document).on("click", function (e) {
      if (!$(e.target).closest(".mobile__menu .dropdown").length) {
        $(".mobile__menu .dropdown").removeClass("active");
        $(".mobile__menu .dropdown_content").slideUp();
      }
    });
  }

  function initCategoryCards() {
    const $cardsContainer = $(".categories__cards");

    $cardsContainer.on("click", ".categories__card", function () {
      const $clicked = $(this);
      if ($clicked.hasClass("categories__card--active")) return;

      $cardsContainer
        .find(".categories__card--active")
        .removeClass("categories__card--active");
      $clicked.addClass("categories__card--active");
    });
  }

  function initBestSellerProducts() {
    const API_TIMEOUT = 10000;
    const PRODUCTS_API =
      "https://furniture-api.fly.dev/v1/products?limit=6&category=sofa&featured=true";
    const FALLBACK_IMAGE = "assets/images/bestseller-1.png";

    const $list = $(".best-seller-section__list");
    const $loading = $(".best-seller-section__loading");
    const $error = $(".best-seller-section__error");

    function formatPrice(price) {
      return "$" + parseFloat(price).toFixed(0);
    }

    function createProductCard(product, isActive) {
      const price = product.discount_price || product.price;
      const cardClass = isActive
        ? "best-seller-section__card--active"
        : "best-seller-section__card";

      const card = $("<div>").addClass(cardClass);
      const img = $("<img>")
        .attr("src", product.image_path)
        .attr("alt", product.name)
        .on("error", function () {
          $(this).attr("src", FALLBACK_IMAGE);
        });

      const cardInfo = $("<div>").addClass("best-seller-section__card-info");
      const priceBadge = $("<p>")
        .addClass("price-badge")
        .text(formatPrice(price));
      const productName = $("<p>")
        .addClass("best-seller-section__card-name")
        .text(product.name);

      cardInfo.append(priceBadge, productName);
      card.append(img, cardInfo);

      return card;
    }

    function loadProducts() {
      $loading.show();
      $error.hide();
      $list.empty();

      $.ajax({
        url: PRODUCTS_API,
        method: "GET",
        dataType: "json",
        timeout: API_TIMEOUT,
        success: function (response) {
          if (response.success && response.data && response.data.length > 0) {
            const products = response.data;

            products.forEach(function (product, index) {
              const isActive = index === 1;
              const card = createProductCard(product, isActive);
              $list.append(card);
            });

            $loading.hide();
            initCarousel();
          } else {
            throw new Error("No products found");
          }
        },
        error: function (xhr, status, error) {
          console.error("Failed to load products:", error);
          $loading.hide();
          $error.show();
        },
      });
    }

    loadProducts();
  }

  function initCarousel() {
    const BREAKPOINT_MOBILE = 768;
    const ANIMATION_DURATION = 450;
    const DEFAULT_GAP = 36;
    const FALLBACK_WIDTH = 300;

    const $list = $(".best-seller-section__list");
    const $pagination = $(".best-seller-section__pagination");

    if (!$list.length || !$pagination.length) return;
    if ($list.children().length === 0) return;

    let isAnimating = false;

    function getGapPx() {
      const gap = parseFloat(
        getComputedStyle($list[0]).columnGap ||
          getComputedStyle($list[0]).gap ||
          DEFAULT_GAP
      );
      return isNaN(gap) ? DEFAULT_GAP : gap;
    }

    function getInactiveWidth() {
      const $img = $list
        .children(".best-seller-section__card")
        .first()
        .find("img");
      if ($img.length) return $img.outerWidth();
      const $fallback = $list
        .children()
        .not(".best-seller-section__card--active")
        .first()
        .find("img");
      if ($fallback.length) return $fallback.outerWidth();
      return FALLBACK_WIDTH;
    }

    function setActiveCard() {
      const $children = $list.children();
      $children
        .filter(".best-seller-section__card--active")
        .removeClass("best-seller-section__card--active")
        .addClass("best-seller-section__card");

      const isMobile = window.innerWidth <= BREAKPOINT_MOBILE;
      const activeIndex = isMobile ? 0 : 1;

      const $activeCard = $children.eq(activeIndex);
      if ($activeCard.length) {
        $activeCard.removeClass("best-seller-section__card");
        $activeCard.addClass("best-seller-section__card--active");
      }
    }

    function animateShift(direction) {
      if (isAnimating) return;
      const $children = $list.children();
      if ($children.length <= 1) return;

      isAnimating = true;

      const shift = getInactiveWidth() + getGapPx();
      const translate = direction === "left" ? shift : -shift;

      const tween = { value: 0 };
      $(tween).animate(
        { value: translate },
        {
          duration: ANIMATION_DURATION,
          easing: "swing",
          step: function (now) {
            $list.css("transform", "translateX(" + now + "px)");
          },
          complete: function () {
            $list.css("transition", "none");
            if (direction === "left") {
              $list.prepend($children.last());
            } else {
              $list.append($children.first());
            }
            $list.css("transform", "translateX(0)");
            void $list[0].offsetHeight;
            $list.css("transition", "");
            setActiveCard();
            isAnimating = false;
          },
        }
      );
    }

    $pagination.find(".best-seller-section__pagination-item").off("click");

    $pagination
      .find(".best-seller-section__pagination-item")
      .eq(0)
      .on("click", function (e) {
        e.preventDefault();
        animateShift("left");
      });

    $pagination
      .find(".best-seller-section__pagination-item")
      .eq(1)
      .on("click", function (e) {
        e.preventDefault();
        animateShift("right");
      });

    $(window).off("resize.carousel").on("resize.carousel", setActiveCard);

    setActiveCard();
  }

  function initHeaderScroll() {
    const SCROLL_THRESHOLD = 100;
    const SCROLL_DEBOUNCE = 10;

    function handleScroll() {
      const scrollTop = $(window).scrollTop();

      if (scrollTop > SCROLL_THRESHOLD) {
        $header.addClass("scrolled");
      } else {
        $header.removeClass("scrolled");
      }
    }

    let scrollTimeout;
    $(window).on("scroll", function () {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      scrollTimeout = setTimeout(handleScroll, SCROLL_DEBOUNCE);
    });

    handleScroll();
  }

  $(document).ready(function () {
    initMobileNavigation();
    initMobileDropdown();
    initCategoryCards();
    initBestSellerProducts();
    initHeaderScroll();
  });
})(jQuery);
