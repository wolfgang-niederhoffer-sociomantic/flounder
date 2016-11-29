/* globals console, document, setTimeout, window */
import utils            from './utils';
import keycodes         from './keycodes';

const nativeSlice = Array.prototype.slice;

const events = {

    /**
     * ## addFirstTouchListeners
     *
     * adds the listeners for onFirstTouch
     *
     * @return {Void} void
     */
    addFirstTouchListeners()
    {
        const refs = this.refs;
        refs.selected.addEventListener( 'click', this.firstTouchController );
        refs.select.addEventListener( 'focus', this.firstTouchController );

        if ( this.props.openOnHover )
        {
            refs.wrapper.addEventListener( 'mouseenter',
                                                    this.firstTouchController );
        }
    },


    /**
     * ## addHoverClass
     *
     * adds a hover class to an element
     *
     * @param {Object} e event object
     *
     * @return {Void} void
     */
    addHoverClass( e )
    {
        utils.addClass( e.target, this.classes.HOVER );
    },


    /**
     * ## addListeners
     *
     * adds listeners on render
     *
     * @param {Object} refs DOM element references
     *
     * @return {Void} void
     */
    addListeners( refs )
    {
        const ios         = this.isIos;
        const changeEvent = ios ? 'blur' : 'change';


        refs.select.addEventListener( changeEvent, this.divertTarget );
        refs.flounder.addEventListener( 'keydown', this.checkFlounderKeypress );


        if ( this.props.openOnHover )
        {
            const wrapper = refs.wrapper;
            wrapper.addEventListener( 'mouseenter', this.toggleList );
            wrapper.addEventListener( 'mouseleave', this.toggleList );
        }
        else
        {
            refs.selected.addEventListener( 'click', this.toggleList );
        }

        this.addFirstTouchListeners();
        this.addOptionsListeners();

        if ( this.search )
        {
            this.addSearchListeners();
        }
    },


    /**
     * ## addMultipleTags
     *
     * adds a tag for each selected option and attaches the correct events to it
     *
     * @param {Array} selectedOptions currently selected options
     * @param {DOMElement} multiTagWrapper parent element of the tags
     *
     * @return {Void} void
     */
    addMultipleTags( selectedOptions, multiTagWrapper )
    {
        selectedOptions.forEach( option =>
        {
            if ( option.value !== '' )
            {
                const tag = this.buildMultiTag( option );

                multiTagWrapper.appendChild( tag );
            }
            else
            {
                option.selected = false;
            }
        } );

        nativeSlice.call( multiTagWrapper.children, 0, -1 ).forEach( el =>
        {
            if ( el.firstChild )
            {
                el.firstChild.addEventListener( 'click',
                    this.removeMultiTag );
            }

            el.addEventListener( 'keydown', this.checkMultiTagKeydown );
        } );
    },


    /**
     * ## addOptionsListeners
     *
     * adds listeners to the options
     *
     * @return {Void} void
     */
    addOptionsListeners()
    {
        this.refs.data.forEach( dataObj =>
        {
            if ( dataObj.tagName === 'DIV' )
            {
                dataObj.addEventListener( 'mouseenter', this.addHoverClass );
                dataObj.addEventListener( 'mouseleave', this.removeHoverClass );

                dataObj.addEventListener( 'click', this.clickSet );
            }
        } );
    },


    /**
     * ## addNoMoreOptionsMessage
     *
     * Adding 'No More Options' message to the option list
     *
     * @return {Void} void
     */
    addNoMoreOptionsMessage()
    {
        const classes = this.classes;
        const elProps = {
            className : `${classes.OPTION}  ${classes.NO_RESULTS}`
        };

        const noMoreOptionsEl   = this.refs.noMoreOptionsEl ||
                                            utils.constructElement( elProps );

        noMoreOptionsEl.innerHTML = this.noMoreOptionsMessage;
        this.refs.optionsList.appendChild( noMoreOptionsEl );

        this.refs.noMoreOptionsEl = noMoreOptionsEl;
    },


    /**
     * ## addNoResultsMessage
     *
     * Adding 'No Results' message to the option list
     *
     * @return {Void} void
     */
    addNoResultsMessage()
    {
        const classes = this.classes;
        const elProps = {
            className : `${classes.OPTION}  ${classes.NO_RESULTS}`
        };

        const noResultsEl = this.refs.noResultsEl ||
                                            utils.constructElement( elProps );

        noResultsEl.innerHTML = this.noMoreResultsMessage;
        this.refs.optionsList.appendChild( noResultsEl );

        this.refs.noResultsEl = noResultsEl;
    },


    /**
     * ## addPlaceholder
     *
     * determines what (if anything) should be refilled into the the
     * placeholder position
     *
     * @return {Void} void
     */
    addPlaceholder()
    {
        const selectedValues  = this.getSelectedValues();
        const val             = selectedValues[ 0 ];
        const selectedItems   = this.getSelected();
        const selectedText    = selectedItems.length ?
                                            selectedItems[ 0 ].innerHTML : '';
        const selectedCount   = selectedValues.length;
        const selected        = this.refs.selected;

        switch ( selectedCount )
        {
        case 0:
            this.setByIndex( 0 );
            break;
        case 1:
            selected.innerHTML = selectedText;
            break;
        default:
            selected.innerHTML = this.multipleMessage;
            break;
        }

        if ( this.multipleTags )
        {
            if ( selectedCount === 0 )
            {
                this.setByIndex( 0 );
            }

            if ( !val || val === '' )
            {
                selected.innerHTML = this.placeholder;
            }
            else
            {
                selected.innerHTML = '';
            }
        }
    },


    /**
     * ## addSearchListeners
     *
     * adds listeners to the search box
     *
     * @return {Void} void
     */
    addSearchListeners()
    {
        const search                  = this.refs.search;
        const multiTagWrapper         = this.refs.multiTagWrapper;

        if ( multiTagWrapper )
        {
            multiTagWrapper.addEventListener( 'click',
                                                this.toggleListSearchClick );
        }

        search.addEventListener( 'click', this.toggleListSearchClick );
        search.addEventListener( 'focus', this.toggleListSearchClick );
        search.addEventListener( 'keyup', this.fuzzySearch );
        search.addEventListener( 'focus', this.clearPlaceholder );
    },


    /**
     * ## addSelectKeyListener
     *
     * adds a listener to the selectbox to allow for seeking through the native
     * selectbox on keypress
     *
     * @return {Void} void
     */
    addSelectKeyListener()
    {
        const refs    = this.refs;
        const select  = refs.select;

        select.addEventListener( 'keyup', this.setSelectValue );
        select.addEventListener( 'keydown', this.setKeypress );

        // weird shit
        // http://stackoverflow.com/questions/34660500/mobile-safari-multi-select-bug
        if ( this.isIos )
        {
            const classes     = this.classes;
            const firstOption = select.children[ 0 ];

            const plug        = document.createElement( 'OPTION' );
            plug.disabled     = true;
            plug.setAttribute( 'disabled', true );
            plug.className   = classes.PLUG;
            select.insertBefore( plug, firstOption );
        }

        select.focus();
    },


    /**
     * ## catchBodyClick
     *
     * checks if a click is on the menu and, if it isnt, closes the menu
     *
     * @param  {Object} e event object
     *
     * @return {Void} void
     */
    catchBodyClick( e )
    {
        if ( !this.checkClickTarget( e ) )
        {
            this.toggleList( e );
            this.addPlaceholder();
        }
    },


    /**
     * ## checkClickTarget
     *
     * checks whether the target of a click is the menu or not
     *
     * @param  {Object} e event object
     * @param  {DOMElement} target click target
     *
     * @return {Boolean}click flouncer or not
     */
    checkClickTarget( e, target )
    {
        target = target || e.target;

        if ( target === document )
        {
            return false;
        }
        else if ( target === this.refs.flounder )
        {
            return true;
        }

        target = target.parentNode;

        if ( target )
        {
            return this.checkClickTarget( e, target );
        }

        return false;
    },


    /**
     * ## checkEnterOnSearch
     *
     * if enter is pressed in the searchox, if there is only one option
     * matching, this selects it
     *
     * @param {Object} e event object
     * @param {Object} refs element references
     *
     * @return {Void} void
     */
    checkEnterOnSearch( e, refs )
    {
        const val  = e.target.value;

        if ( val && val !== '' )
        {
            const res         = [];
            const selected    = this.getSelected();
            const matches     = this.search.isThereAnythingRelatedTo( val );

            matches.forEach( el =>
            {
                const index   = el.i;
                el          = refs.selectOptions[ index ];

                if ( selected.indexOf( el ) === -1 )
                {
                    res.push( el );
                }
            } );

            if ( res.length === 1 )
            {
                const el = res[ 0 ];

                this.setByIndex( el.index, this.multiple );

                if ( this.multipleTags )
                {
                    setTimeout( () => refs.search.focus(), 200 );
                }
            }

            return res;
        }

        return false;
    },


    /**
     * ## checkFlounderKeypress
     *
     * checks flounder focused keypresses and filters all but space and enter
     *
     * @param {Object} e event object
     *
     * @return {Void} void
     */
    checkFlounderKeypress( e )
    {
        const keyCode = e.keyCode;
        const refs    = this.refs;
        const classes = this.classes;

        if ( keyCode === keycodes.TAB )
        {
            const optionsList = refs.optionsListWrapper;
            const wrapper     = refs.wrapper;

            this.addPlaceholder();
            this.toggleClosed( e, optionsList, refs, wrapper, true );
        }
        else if ( keyCode === keycodes.ENTER ||
            keyCode === keycodes.SPACE && e.target.tagName !== 'INPUT' )
        {
            if ( keyCode === keycodes.ENTER && this.search &&
                    utils.hasClass( refs.wrapper, classes.OPEN ) )
            {
                return this.checkEnterOnSearch( e, refs );
            }

            e.preventDefault();
            this.toggleList( e );
        }
         // letters - allows native behavior
        else if ( keyCode >= 48 && keyCode <= 57 ||
                    keyCode >= 65 && keyCode <= 90 )
        {
            if ( refs.search && e.target.tagName === 'INPUT' )
            {
                refs.selected.innerHTML = '';
            }
        }
    },


    /**
     * ## checkMultiTagKeydown
     *
     * when a tag is selected, this decided how to handle it by either
     * passing the event on, or handling tag removal
     *
     * @param {Object} e event object
     *
     * @return {Void} void
     */
    checkMultiTagKeydown( e )
    {
        const keyCode               = e.keyCode;
        const self                  = this;
        const refs                  = this.refs;
        const children              = refs.multiTagWrapper.children;
        const target                = e.target;
        const index                 = nativeSlice.call( children, 0 )
                                                            .indexOf( target );

        /**
         * ## focusSearch
         *
         * focus' on the search input
         *
         * @return {Void}  void
         */
        function focusSearch()
        {
            refs.search.focus();
            self.clearPlaceholder();
            self.toggleListSearchClick( e );
        }


        if ( keyCode === keycodes.LEFT || keyCode === keycodes.RIGHT ||
            keyCode === keycodes.BACKSPACE )
        {
            e.preventDefault();
            e.stopPropagation();


            if ( keyCode === keycodes.BACKSPACE )
            {
                self.checkMultiTagKeydownRemove( target, focusSearch, index );
            }
            else
            {
                self.checkMultiTagKeydownNavigate( focusSearch, keyCode,
                                                                        index );
            }
        }
        else if ( e.key.length < 2 )
        {
            focusSearch();
        }
    },


    /**
     * ## checkMultiTagKeydownNavigate
     *
     * after left or right is hit while a multitag is focused, this focus' on
     * the next tag in that direction or the the search field
     *
     * @param {Function} focusSearch function to focus on the search field
     * @param {Number} keyCode keyclode from te keypress event
     * @param {Number} index index of currently focused tag
     *
     * @return {Void} void
     */
    checkMultiTagKeydownNavigate( focusSearch, keyCode, index )
    {
        const children   = this.refs.multiTagWrapper.children;

        const adjustment = keyCode - 38;
        const newIndex   = index + adjustment;
        const length     = children.length - 1;

        if ( newIndex > length )
        {
            focusSearch();
        }
        else if ( newIndex >= 0 )
        {
            children[ newIndex ].focus();
        }
    },


    /**
     * ## checkMultiTagKeydownRemove
     *
     * after a backspece while a multitag is focused, this removes the tag and
     * focus' on the next
     *
     * @param {DOMElement} target focused multitag
     * @param {Function} focusSearch function to focus on the search field
     * @param {Number} index index of currently focused tag
     *
     * @return {Void} void
     */
    checkMultiTagKeydownRemove( target, focusSearch, index )
    {
        const children  = this.refs.multiTagWrapper.children;
        const siblings  = children.length - 1;

        target.firstChild.click();

        if ( siblings > 0 )
        {
            children[ index === 0 ? 0 : index - 1 ].focus();
        }
        else
        {
            focusSearch();
        }
    },


    /**
     * ## clearPlaceholder
     *
     * clears the placeholder
     *
     * @param {Object} e event object
     *
     * @return {Void} void
     */
    clearPlaceholder()
    {
        this.refs.selected.innerHTML = '';
    },


    /**
     * ## clickSet
     *
     * when a flounder option is clicked on it needs to set the option as
     * selected
     *
     * @param {Object} e event object
     *
     * @return {Void} void
     */
    clickSet( e )
    {
        e.preventDefault();
        e.stopPropagation();

        this.setSelectValue( {}, e );

        if ( !this.programmaticClick )
        {
            this.toggleList( e );
        }

        this.programmaticClick = false;
    },


    /**
     * ## displayMultipleTags
     *
     * handles the display and management of tags
     *
     * @param  {Array} selectedOptions currently selected options
     * @param  {DOMElement} multiTagWrapper div to display
     *                                       currently selected options
     *
     * @return {Void} void
     */
    displayMultipleTags( selectedOptions, multiTagWrapper )
    {
        nativeSlice.call( multiTagWrapper.children, 0, -1 ).forEach( el =>
        {
            if ( el.firstChild )
            {
                el.firstChild.addEventListener( 'click',
                    this.removeMultiTag );
            }

            el.removeEventListener( 'keydown', this.checkMultiTagKeydown );
        } );

        multiTagWrapper.innerHTML = '';

        if ( selectedOptions.length > 0 )
        {
            this.addMultipleTags( selectedOptions, multiTagWrapper );
        }
        else
        {
            this.addPlaceholder();
        }

        this.addSearch( multiTagWrapper );
    },


    /**
     * ## displaySelected
     *
     * formats and displays the chosen options
     *
     * @param {DOMElement} selected display area for the selected option(s)
     * @param {Object} refs element references
     *
     * @return {Void} void
     */
    displaySelected( selected, refs )
    {
        let value = [];
        let index = -1;

        const selectedOption  = this.getSelected();
        const selectedLength  = selectedOption.length;
        const multipleTags    = this.multipleTags;

        if ( !multipleTags && selectedLength ===  1 )
        {
            index               = selectedOption[ 0 ].index;
            selected.innerHTML  = refs.data[ index ].innerHTML;
            value               = selectedOption[ 0 ].value;
        }
        else if ( !multipleTags && selectedLength === 0 )
        {
            const defaultValue  = this.defaultObj;
            index               = defaultValue.index || -1;
            selected.innerHTML  = defaultValue.text;
            value               = defaultValue.value;
        }
        else
        {
            if ( multipleTags )
            {
                selected.innerHTML  = '';
                this.displayMultipleTags( selectedOption,
                                                        refs.multiTagWrapper );
            }
            else
            {
                selected.innerHTML  = this.multipleMessage;
            }

            index = selectedOption.map( option => option.index );
            value = selectedOption.map( option => option.value );
        }

        selected.setAttribute( 'data-value', value );
        selected.setAttribute( 'data-index', index );
    },


    /**
     * ## divertTarget
     *
     * @param {Object} e event object
     *
     * on interaction with the raw select box, the target will be diverted to
     * the corresponding flounder list element
     *
     * @return {Void} void
     */
    divertTarget( e )
    {
        // weird shit
        // http://stackoverflow.com/questions/34660500/mobile-safari-multi-select-bug
        if ( this.isIos )
        {
            const select  = this.refs.select;
            const classes = this.classes;
            const plug    = select.querySelector( `.${classes.PLUG}` );

            if ( plug )
            {
                select.removeChild( plug );
            }
        }

        const index   = e.target.selectedIndex;

        const event      = {
            type            : e.type,
            target          : this.data[ index ]
        };

        if ( this.multipleTags )
        {
            e.preventDefault();
            e.stopPropagation();
        }

        this.setSelectValue( event );

        if ( !this.multiple )
        {
            this.toggleList( e, 'close' );
        }
    },


    /**
     * ## firstTouchController
     *
     * on first interaction, onFirstTouch is run, then the event listener is
     * removed
     *
     * @param {Object} e event object
     *
     * @return {Void} void
     */
    firstTouchController( e )
    {
        const refs = this.refs;

        try
        {
            this.onFirstTouch( e );
        }
        catch ( e )
        {
            console.warn( 'something may be wrong in "onFirstTouch"', e );
        }

        refs.selected.removeEventListener( 'click', this.firstTouchController );
        refs.select.removeEventListener( 'focus', this.firstTouchController );

        if ( this.props.openOnHover )
        {
            refs.wrapper.removeEventListener( 'mouseenter',
                                                    this.firstTouchController );
        }
    },


    /**
     * ## removeHoverClass
     *
     * removes a hover class from an element
     *
     * @param {Object} e event object
     * @return {Void} void
     */
    removeHoverClass( e )
    {
        utils.removeClass( e.target, this.classes.HOVER );
    },


    /**
     * ## removeListeners
     *
     * removes event listeners from flounder.  normally pre unload
     *
     * @return {Void} void
     */
    removeListeners()
    {
        const refs            = this.refs;

        this.removeOptionsListeners();

        const qsHTML          = document.querySelector( 'html' );
        const catchBodyClick  = this.catchBodyClick;
        qsHTML.removeEventListener( 'click', catchBodyClick );
        qsHTML.removeEventListener( 'touchend', catchBodyClick );

        const select = refs.select;
        select.removeEventListener( 'change', this.divertTarget  );
        select.removeEventListener( 'blur', this.divertTarget );
        refs.selected.removeEventListener( 'click', this.toggleList );
        refs.flounder.removeEventListener( 'keydown',
                                                this.checkFlounderKeypress );

        if ( this.search )
        {
            this.removeSearchListeners();
        }
    },


    /**
     * ## removeMultiTag
     *
     * removes a multi selection tag on click; fixes all references to value
     * and state
     *
     * @param  {Object} e event object
     *
     * @return {Void} void
     */
    removeMultiTag( e )
    {
        e.preventDefault();
        e.stopPropagation();

        let value;
        let index;
        const classes         = this.classes;
        const refs            = this.refs;
        const select          = refs.select;
        const selected        = refs.selected;
        const target          = e.target;
        const data            = this.refs.data;
        const targetIndex     = target.getAttribute( 'data-index' );

        select[ targetIndex ].selected = false;

        const selectedOptions = this.getSelected();

        utils.removeClass( data[ targetIndex ], classes.SELECTED_HIDDEN );
        utils.removeClass( data[ targetIndex ], classes.SELECTED );

        target.removeEventListener( 'click', this.removeMultiTag );

        const span = target.parentNode;
        span.parentNode.removeChild( span );

        if ( selectedOptions.length === 0 )
        {
            this.addPlaceholder();
            index               = -1;
            value               = '';
        }
        else
        {
            value = selectedOptions.map( option =>
            {
                return option.value;
            } );

            index = selectedOptions.map( option =>
            {
                return option.index;
            } );
        }

        this.removeNoMoreOptionsMessage();
        this.removeNoResultsMessage();

        selected.setAttribute( 'data-value', value );
        selected.setAttribute( 'data-index', index );

        try
        {
            this.onChange( e, this.getSelectedValues() );
        }
        catch ( e )
        {
            console.warn( 'something may be wrong in "onChange"', e );
        }
    },


    /**
     * ## removeOptionsListeners
     *
     * removes event listeners on the data divs
     *
     * @return {Void} void
     */
    removeOptionsListeners()
    {
        this.refs.data.forEach( dataObj =>
        {
            if ( dataObj.tagName === 'DIV' )
            {
                dataObj.removeEventListener( 'click', this.clickSet );

                dataObj.removeEventListener( 'mouseenter', this.addHoverClass );
                dataObj.removeEventListener( 'mouseleave',
                                                        this.removeHoverClass );
            }
        } );
    },


    /**
     * ## removeNoMoreOptionsMessage
     *
     * Removing 'No More options' message from the option list
     *
     * @return {Void} void
     */
    removeNoMoreOptionsMessage()
    {
        const noMoreOptionsEl =  this.refs.noMoreOptionsEl;

        if ( this.refs.optionsList && noMoreOptionsEl )
        {
            this.refs.optionsList.removeChild( noMoreOptionsEl );
            this.refs.noMoreOptionsEl = undefined;
        }
    },


    /**
     * ## removeNoResultsMessage
     *
     * Removing 'No Results' message from the option list
     *
     * @return {Void} void
     */
    removeNoResultsMessage()
    {
        const noResultsEl =  this.refs.noResultsEl;

        if ( this.refs.optionsList && noResultsEl )
        {
            this.refs.optionsList.removeChild( noResultsEl );
            this.refs.noResultsEl = undefined;
        }
    },



    /**
     * ## removeSearchListeners
     *
     * removes the listeners from the search input
     *
     * @return {Void} void
     */
    removeSearchListeners()
    {
        const search = this.refs.search;
        search.removeEventListener( 'click', this.toggleListSearchClick );
        search.removeEventListener( 'focus', this.toggleListSearchClick );
        search.removeEventListener( 'keyup', this.fuzzySearch );
        search.removeEventListener( 'focus', this.clearPlaceholder );
    },


    /**
     * ## removeSelectedClass
     *
     * removes the [[this.selectedClass]] from all data
     *
     * @param {Array} data array of data objects
     *
     * @return {Void} void
     */
    removeSelectedClass( data )
    {
        data = data || this.refs.data;

        data.forEach( dataObj =>
        {
            utils.removeClass( dataObj, this.selectedClass );
        } );
    },


    /**
     * ## removeSelectedValue
     *
     * sets the selected property to false for all data
     *
     * @param {Array} data array of data objects
     *
     * @return {Void} void
     */
    removeSelectedValue( data )
    {
        data                = data || this.refs.data;
        const optionTags    = this.refs.select.children;

        data.forEach( ( d, i ) =>
        {
            optionTags[ i ].selected = false;
        } );
    },


    /**
     * ## removeSelectKeyListener
     *
     * disables the event listener on the native select box
     *
     * @return {Void} void
     */
    removeSelectKeyListener()
    {
        const select = this.refs.select;
        select.removeEventListener( 'keyup', this.setSelectValue );
    },


    /**
     * ## setKeypress
     *
     * handles arrow key and enter selection
     *
     * @param {Object} e event object
     *
     * @return {Void} void
     */
    setKeypress( e )
    {
        const refs      = this.refs;
        let increment   = 0;
        const keyCode   = e.keyCode;

        const nonCharacterKeys = keycodes.NON_CHARACTER_KEYS;

        if ( nonCharacterKeys.indexOf( keyCode ) === -1 )
        {
            if ( keyCode === keycodes.TAB )
            {
                const optionsList = refs.optionsListWrapper;
                const wrapper     = refs.wrapper;

                this.addPlaceholder();
                this.toggleClosed( e, optionsList, refs, wrapper, true );

                return false;
            }

            if ( keyCode === keycodes.ENTER || keyCode === keycodes.ESCAPE ||
                    keyCode === keycodes.SPACE )
            {
                this.toggleList( e );

                return false;
            }

            if ( keyCode === keycodes.UP || keyCode === keycodes.DOWN )
            {
                if ( !window.sidebar )
                {
                    e.preventDefault();

                    if ( refs.search )
                    {
                        refs.search.value = '';
                    }

                    increment = keyCode - 39;
                }

                this.setKeypressElement( e, increment );
            }

            return true;
        }
    },


    /**
     * ## setKeypressElement
     *
     * sets the element after the keypress.  if the element is hidden or
     * disabled, it passes the event back to setKeypress to process the next
     * element
     *
     * @param {Object} e event object
     * @param {Number} increment amount to change the index by
     *
     * @return {Void} void
     */
    setKeypressElement( e, increment )
    {
        const refs              = this.refs;
        const selectTag         = refs.select;
        const data              = refs.data;
        const dataMaxIndex      = data.length - 1;
        let index               = selectTag.selectedIndex + increment;

        if ( index > dataMaxIndex )
        {
            index = 0;
        }
        else if ( index < 0 )
        {
            index = dataMaxIndex;
        }

        const classes           = this.classes;
        const hasClass          = utils.hasClass;
        const dataAtIndex       = data[ index ];

        selectTag.selectedIndex = index;

        if ( hasClass( dataAtIndex, classes.HIDDEN ) ||
             hasClass( dataAtIndex, classes.SELECTED_HIDDEN ) ||
             hasClass( dataAtIndex, classes.SEARCH_HIDDEN ) ||
             hasClass( dataAtIndex, classes.DISABLED ) )
        {
            this.setKeypress( e );
        }

    },


    /**
     * ## setSelectValue
     *
     * sets the selected value in flounder.  when activated by a click,
     * the event object is moved to the second variable.  this gives us the
     * ability to discern between triggered events (keyup) and processed events
     * (click) for the sake of choosing our targets
     *
     * @param {Object} obj possible event object
     * @param {Object} e event object
     *
     * @return {Void} void
     */
    setSelectValue( obj, e )
    {
        const refs    = this.refs;
        let keyCode;

        if ( e ) // click
        {
            this.setSelectValueClick( e );
        }
        else // keypress
        {
            keyCode = obj.keyCode;
            this.setSelectValueButton( obj );
        }

        this.displaySelected( refs.selected, refs );

        if ( !this.programmaticClick )
        {
            // tab, shift, ctrl, alt, caps, cmd
            const nonKeys = [ 9, 16, 17, 18, 20, 91 ];

            if ( e || obj.type === 'blur' ||
                !keyCode && obj.type === 'change' ||
                keyCode && nonKeys.indexOf( keyCode ) === -1 )
            {
                if ( this.toggleList.justOpened && !e )
                {
                    this.toggleList.justOpened = false;
                }
                else
                {
                    try
                    {
                        this.onChange( e, this.getSelectedValues() );
                    }
                    catch ( e )
                    {
                        console.warn( 'something may be wrong in onChange', e );
                    }
                }
            }
            this.programmaticClick = false;
        }
    },


    /**
     * ## setSelectValueButton
     *
     * processes the setting of a value after a keypress event
     *
     * @return {Void} void
     */
    setSelectValueButton()
    {
        const refs          = this.refs;
        const data          = refs.data;
        const selectedClass = this.selectedClass;

        let selectedOption;

        if ( this.multipleTags )
        {
            return false;
        }

        this.removeSelectedClass( data );

        const dataArray       = this.getSelected();
        const baseOption      = dataArray[ 0 ];

        if ( baseOption )
        {
            selectedOption  = data[ baseOption.index ];

            utils.addClass( selectedOption, selectedClass );

            utils.scrollTo( selectedOption );
        }
    },


    /**
     * ## setSelectValueClick
     *
     * processes the setting of a value after a click event
     *
     * @param {Object} e event object
     *
     * @return {Void} void
     */
    setSelectValueClick( e )
    {
        const multiple        = this.multiple;
        const refs            = this.refs;
        const selectedClass   = this.selectedClass;

        if ( ( !multiple ||  multiple && !this.multipleTags &&
                    !e[ this.multiSelect ] ) && !this.forceMultiple )
        {
            this.deselectAll();
        }

        this.forceMultiple   = false;
        const target         = e.target;

        utils.toggleClass( target, selectedClass );
        const index          = target.getAttribute( 'data-index' );
        const selectedOption = refs.selectOptions[ index ];


        selectedOption.selected = selectedOption.selected !== true;

        const firstOption = refs.selectOptions[ 0 ];

        if ( firstOption.value === '' && this.getSelected().length > 1 )
        {
            utils.removeClass( refs.data[ 0 ], selectedClass );
            refs.selectOptions[ 0 ].selected = false;
        }
    },


    /**
     * ## toggleClosed
     *
     * post toggleList, this runs it the list should be closed
     *
     * @param {Object} e event object
     * @param {DOMElement} optionsList the options list
     * @param {Object} refs contains the references of the elements in flounder
     * @param {DOMElement} wrapper wrapper of flounder
     * @param {Boolean} exit prevents refocus. used while tabbing away
     *
     * @return {Void} void
     */
    toggleClosed( e,
                    optionsList,
                    refs,
                    wrapper,
                    exit = false
                )
    {
        const classes = this.classes;

        utils.addClass( refs.optionsListWrapper, classes.HIDDEN );
        this.removeSelectKeyListener();

        utils.removeClass( wrapper, classes.OPEN );

        const qsHTML = document.querySelector( 'html' );
        qsHTML.removeEventListener( 'click', this.catchBodyClick );
        qsHTML.removeEventListener( 'touchend', this.catchBodyClick );

        if ( this.search )
        {
            this.fuzzySearchReset();
        }

        if ( !exit )
        {
            refs.flounder.focus();
        }

        if ( this.ready )
        {
            try
            {
                this.onClose( e, this.getSelectedValues() );
            }
            catch ( e )
            {
                console.warn( 'something may be wrong in "onClose"', e );
            }
        }
    },


    /**
     * ## toggleList
     *
     * on click of flounder--selected, this shows or hides the options list
     *
     * @param {Object} e event object
     * @param {String} force toggle can be forced by passing 'open' or 'close'
     *
     * @return {Void} void
     */
    toggleList( e, force )
    {
        const classes     = this.classes;
        const refs        = this.refs;

        const optionsList = refs.optionsListWrapper;

        const wrapper     = refs.wrapper;
        const isHidden    = utils.hasClass( optionsList, classes.HIDDEN );
        const type        = e.type;

        if ( type === 'mouseleave' || force === 'close' || !isHidden )
        {
            this.toggleList.justOpened = false;
            this.toggleClosed( e, optionsList, refs, wrapper );
        }
        else
        {
            if ( type === 'keydown' )
            {
                this.toggleList.justOpened = true;
            }

            this.toggleOpen( e, optionsList, refs, wrapper );
        }
    },


    /**
     * ## toggleListSearchClick
     *
     * toggleList wrapper for search.  only triggered if flounder is closed
     *
     * @param {Object} e event object
     *
     * @return {Void} void
     */
    toggleListSearchClick( e )
    {
        const classes = this.classes;

        if ( !utils.hasClass( this.refs.wrapper, classes.OPEN ) )
        {
            this.toggleList( e, 'open' );
        }
    },


    /**
     * ## toggleOpen
     *
     * post toggleList, this runs it the list should be opened
     *
     * @param {Object} e event object
     * @param {DOMElement} optionsList the options list
     * @param {Object} refs contains the references of the elements in flounder
     *
     * @return {Void} void
     */
    toggleOpen( e, optionsList, refs )
    {
        this.addSelectKeyListener();

        if ( !this.isIos || this.search || this.multipleTags === true )
        {
            const classes = this.classes;

            utils.removeClass( refs.optionsListWrapper, classes.HIDDEN );
            utils.addClass( refs.wrapper, classes.OPEN );

            const qsHTML = document.querySelector( 'html' );

            qsHTML.addEventListener( 'click', this.catchBodyClick );
            qsHTML.addEventListener( 'touchend', this.catchBodyClick );
        }


        if ( !this.multiple )
        {
            const index       = refs.select.selectedIndex;
            const selectedDiv = refs.data[ index ];

            utils.scrollTo( selectedDiv  );
        }

        if ( this.search )
        {
            refs.search.focus();
        }

        let optionCount = refs.data.length;

        if ( this.props.placeholder )
        {
            optionCount--;
        }

        if ( refs.multiTagWrapper && refs.multiTagWrapper.childNodes.length ===
                                            optionCount )
        {
            this.removeNoResultsMessage();
            this.addNoMoreOptionsMessage();
        }

        if ( this.ready )
        {
            try
            {
                this.onOpen( e, this.getSelectedValues() );
            }
            catch ( e )
            {
                console.warn( 'something may be wrong in "onOpen"', e );
            }
        }

    }
};


export default events;
