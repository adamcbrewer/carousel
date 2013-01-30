// Custom Carousel Class
//
// Set the left position of the carousel <ul> according to the widths on the <li>'s contained.
// Relies on css-transitions for the animation.
//
// @author Adam Brewer
// ================================
//
// @args
//
// el			- The element wrapping the carousel and nav.
// eventType	- Delegate the event used for either clicking or tapping. Defaults to 'click'
// automove	- Auto-slide the carousel. Specify a number to be used in the timeout. Not set by default.
//
//
//
;var Carousel = function (args) {

	// passed in arguments
	args = args || {};

	if (!args.el) {
		console.error('Please specify a carousel container');
		return false;
	}

	// public methods
	var carousel = {

		init: function () {
			this.current = args.goto || 0;

			this._setup(args.el);
			this._calcDimentions();
			this._bindEvents();

			// start the functionality of the slider
			this.goto(this.current);

			// args.automove should be an integer of seconds delay
			if (args.automove) {
				this.initAutomove(args.automove);
			}

		},

		goto: function (slidePos) {

			var leftPos = (slidePos * this.moveDist);

            // don't overshoot if we have
            // multiple items in the carousel window
            if (this.maxMoveLeft && leftPos > this.maxMoveLeft) {
                leftPos = this.maxMoveLeft;
            }

            this.current = parseInt(slidePos, 10);

            this.list.css({ left: -leftPos });
            if (this.paginators) {
                this.updatePrevNext(leftPos);
            }

		},

		updatePrevNext: function () {
			if (!args.continuous) {
                if (this.slideCount === 1) {
                    this.prevNext.addClass('disable');
                } else {
                    if (this.current === 0) {
                        this.prevNext.removeClass('disable').filter('[data-gotoslide="prev"]').addClass('disable');
                    } else if (this.current === this.slideCount-1) {
                        this.prevNext.removeClass('disable').filter('[data-gotoslide="next"]').addClass('disable');
                    } else {
                        if (this.prevNext.hasClass('disable')) this.prevNext.removeClass('disable');
                    }
                }
            }

			// remove the 'next' button if we have multiple
            // items in the carousel window
            if (this.maxMoveLeft && slidePos >= this.maxMoveLeft) {
                this.prevNext.filter('[data-gotoslide="next"]').addClass('disable');
            }

            if (this.paginators) {
                this.updatePagination(this.paginators.filter('[data-gotoslide="'+this.current+'"]'));
            }

		},

		updatePagination: function (el) {
			this.paginators.removeClass('current');
			el.addClass('current');
		},

		initAutomove:  function (int) {
			int = (typeof int === 'number') ? int : 4000;

			var that = this;

			this._autoInterval = setInterval(function () {
				that.processWhere('next', args.continuous);
			}, int);

		},

		processWhere: function (where, continuous) {
			where = where || false;
			continuous = continuous || false;

			var pos = null;
			switch (where) {
				case 'prev':
					if ( ( this.current - 1 ) >= 0 ) {
						pos = --this.current;
					} else {
						if (continuous) this.current = this.slideCount-1; // restart if continuous
						pos = this.current;
					}
					break;
				case 'next':
					if ( ( this.current + 1 ) < this.slideCount ) {
						pos = ++this.current;
					} else {
						if (continuous) this.current = 0; // restart if continuous
						pos = this.current;
					}
					break;
				// the default should be a number
				default:
					pos = where;
					this.current = pos;
					break;
			}
			if (pos !== null) this.goto(pos);

		},


		// Items are expected match the HTML structre and style
        // of the other items on the slide list
        addItems: function (items) {

            items = items || [];

            if (items.length > 0) {
                var i = 0;
                for (i; i < items.length; i++) {
                    var newSlide = items[i];
                    this.list.append(newSlide);

                    this.slideCount++;

                    // update the number of paginated items
                    if (this.paginators) {
                        var pageItem = this.nav.find('.carousel-page').last(),
                            newItem = pageItem.clone();
                        pageItem.after(newItem);
                        newItem.find('[data-gotoslide]').attr('data-gotoslide', this.slideCount - 1).html(this.slideCount).removeClass('current');
                    }

                }

                // need to run setup in order to track some of
                // the new elements
                this._setup(this.el);

            }

            return this;

        },

        removeItems: function (items) {

			items = items || [];

			// make sure we have items to remove
            if (items.length > 0) {
                var i = 0;
                for (i; i < items.length; i++) {

					// decrement the slideCount and
					// current slide item as we go
                    this.slideCount--;
                    this.current--;

                    // remove the page item we've requested
                    if (this.paginators) {
                        $(this.nav.find('li')[i]).remove();
                    }
                    // remove the slide element
                    $(this.slides[i]).remove();

                }

                // need to run setup in order to track some of
                // the new elements
                this._setup(this.el);

                // now we need to update the indexes of all
                // other gotoslide links
                // TODO: innerHTML of the links
                if (this.paginators) {
                    var k = 0;
                    for (k; k < this.slideCount; k++) {
                        $(this.paginators[k]).attr('data-gotoslide', k);
                    }
                }

                // make sure we're stil on the
                // last items we were previously viewing
                this.goto(this.current);

            }

            return this;

        },


		_bindEvents: function (el) {

			var that = this,
				eventType = args.eventType || 'click';

			this.nav.on(eventType, '[data-gotoslide]', function (evt) {
				evt.preventDefault();

				var where = this.getAttribute('data-gotoslide');
				that.processWhere(where, args.continuous);

			});

			this.carousel.on(eventType, function (evt) {
				evt.preventDefault();
				that.processWhere('next', args.continuous);

			});

			// pause the auto timeout where the user is focusing in on it
			if (args.automove) {
				args.el.on({
					mouseenter: function (evt) {
						if (that._autoInterval) clearInterval(that._autoInterval), that._autoInterval = false;
					},
					mouseleave: function () {
						if (!that._autoInterval) that.initAutomove(args.automove);
					}
				});
			}

			// Enable keyboard naviagation
			if (args.keyNav) {
				if (window.addEventListener) window.addEventListener('keydown', function (evt) {
					var keycode = evt.keyCode || false;
					if (keycode) {

						// Cycling (prev/next using key arrows)
						if (keycode === 37) { // left
							that.processWhere('prev', args.continuous);
						} else if (keycode === 39) { // left
							that.processWhere('next', args.continuous);
						}

					}
				});
			}

		},

		_calcDimentions: function () {

			var firstSlide = this.slides.first(),
                moveDist = parseInt(firstSlide.css('width'), 10) + parseInt(firstSlide.css('marginRight'), 10),
                carouselWidth = parseInt(this.carousel.css('width'), 10);

            // the carousel moves the distance of the width of the slides
            this.moveDist = moveDist;

            // However, if there are multiple items in the carousel view window
            // then we have to make sure we don't want to 'slide-past' the last item
            if (moveDist < carouselWidth) {
                var combinedSlideWidth = moveDist * this.slides.length + parseInt(this.list.css('paddingRight'), 10);
                this.maxMoveLeft = combinedSlideWidth - carouselWidth;

            }

		},

		_setup: function (el) {

			// storing the elements for later
			this.el = el;
			this.carousel = el.find('.carousel');
			this.list = el.find('.carousel-list');
			this.slides = el.find('.carousel-item');
			this.nav = el.find('.carousel-nav');
			this.prevNext = args.pagination ? el.find('.carousel-pagination').find('[data-gotoslide="prev"], [data-gotoslide="next"]') : false;
			this.paginators = args.pagination ? el.find('.carousel-pagination').find('[data-gotoslide]') : false;

			this.slideCount = this.slides.length;

		}

	};

	carousel.init();

	return carousel;

};
