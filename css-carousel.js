// CSS Carousel
//
// Set the left position of the carousel <ul> according to the widths on the <li>'s contained.
// Relies on css-transitions for the animation.
//
// @author Adam Brewer
// ================================
//
//
//
;var Carousel = function (args) {

	//
	// Private Methods
	// =======================
	//

	args = args || {};

	if (!args.el) {
		console.error('Please specify a carousel container');
		return false;
	}


	/**
	 * An extend function to merg our default arguments
	 * with a passed in from the user
	 *
	 * @param  {object} obj    The default settings
	 * @param  {object} extObj Arguments from the user
	 * @return {object}        A merged object
	 *
	 */
	var extend = function(obj, extObj) {
		if (arguments.length > 2) {
			var a = 1;
			for (a; a < arguments.length; a++) {
				extend(obj, arguments[a]);
			}
		} else {
			for (var i in extObj) {
				obj[i] = extObj[i];
			}
		}
		return obj;
	};


	/**
	 * These are the default settings for our carousel
	 *
	 */
	var defaultArgs = {
		eventType: 'click',
		automove: false,
		continuous: false,
		pagination: true,
		keyNav: false,
		goto: 0
	};

	// merging passed in arguments with our own
	args = extend(defaultArgs, args);



	var _bindEvents = function (args) {

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

	};


	var _setup = function (args) {

		var el = args.el;

		this.current = args.goto || 0;

		// storing the elements for later
		this.el = el;
		this.carousel = el.find('.carousel');
		this.list = el.find('.carousel-list');
		this.slides = el.find('.carousel-item');
		this.nav = el.find('.carousel-nav');
		this.prevNext = args.pagination ? el.find('.carousel-pagination').find('[data-gotoslide="prev"], [data-gotoslide="next"]') : false;
		this.paginators = args.pagination ? el.find('.carousel-pagination').find('[data-gotoslide]') : false;

		this.slideCount = this.slides.length;

	};


	var _calcDimentions = function () {

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

	};




	//
	// Public Methods
	// =======================
	//




	var carousel = {

		init: function (args) {

			_setup.call(this, args);
			_calcDimentions.call(this);
			_bindEvents.call(this, args);

			// start the functionality of the slider
			this.goto(this.current);

			// args.automove should be an integer of seconds delay
			if (args.automove) {
				this.initAutomove(args.automove);
			}

		},


		/**
		 * Force the carousel the slide number passed
		 *
		 */
		goto: function (pos) {

			pos = parseInt(pos, 10);

			var leftPos = (pos * this.moveDist);

            // don't overshoot if we have
            // multiple items in the carousel window
            if (this.maxMoveLeft && leftPos > this.maxMoveLeft) {
                leftPos = this.maxMoveLeft;
            }

            this.current = pos;

            // Update the carousel left position to
            // bring the requested slide in to view
            this.list.css({ left: -leftPos });

            if (this.paginators) {
                this.updatePrevNext(leftPos);
            }

		},


		/**
		 * Governs the hiding and showing of the 'previous'
		 * and 'next' pagination links
		 *
		 */
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


		/**
		 * Updates the pagination to highlight
		 * the 'current' slide
		 *
		 */
		updatePagination: function (el) {
			this.paginators.removeClass('current');
			el.addClass('current');
		},


		/**
		 * Automated animation of the carousel.
		 * Requires an integer of milliseconds to be passed
		 * in to the 'automove' property when initiated
		 *
		 */
		initAutomove:  function (int) {
			int = (typeof int === 'number') ? int : 4000;

			var that = this;

			this._autoInterval = setInterval(function () {
				that.processWhere('next', args.continuous);
			}, int);

		},


		/**
		 * Figues out where you want to go in the carousel by passing
		 * in either a string for 'next|prev', or a slide number.
		 *
		 * If 'continuous' is passed in as true, the carousel will
		 * continue in the direction of choice indefinitely.
		 *
		 * @param  {string|number} where
		 * @param  {boolean} continuous
		 *
		 */
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
					pos = parseInt(where, 10);
					this.current = pos;
					break;

			}
			if (pos !== null) this.goto(pos);

		},


		/**
		 * Will add an array of new slide items.
		 * Items are expected match the HTML structre and style
		 * of the other items on the slide list.
		 *
		 */
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


        /**
         * Removes items off the carousel.
         *
         * @param  {array} items An array of integers of the slide numbers being removed
         *
         */
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

        }

	};


	carousel.init(args);

	return carousel;

};
