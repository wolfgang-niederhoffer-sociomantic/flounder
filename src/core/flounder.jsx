
/* jshint globalstrict: true */
'use strict';

import defaultOptions   from './defaults';
import classes          from './classes';
import utils            from './utils';

class Flounder
{
    /**
     * ## constructor
     *
     * main constuctor
     *
     * @param {DOMElement} target flounder mount point
     * @param {Object} props passed options
     *
     * @return _Object_ new flounder object
     */
    constructor( target, props )
    {
        if ( target && target.length !== 0 )
        {
            if ( target.jquery )
            {
                return target.map( ( i, _el ) => new this.constructor( _el, props ) );
            }
            else if ( target.isMicrobe  )
            {
                return target.map( ( _el ) => new this.constructor( _el, props ) );
            }

            this.props  = props;
            target      = target.nodeType === 1 ? target : document.querySelector( target );

            this.originalTarget = target;

            if ( target.tagName === 'INPUT' )
            {
                this.addClass( target, classes.HIDDEN );
                target.tabIndex = -1;
                target          = target.parentNode;
            }

            this.target     = target;

            this.bindThis();

            this.initialzeOptions();

            this.onInit();

            this.buildDom();

            this.setPlatform();

            this.onRender();

            this.onComponentDidMount();

            this.refs.select.flounder = this.refs.selected.flounder = this.target.flounder = this;

            return this;
        }
        else if ( !target && !props )
        {
            return this.constructor;
        }
    }


    /**
     * ## addOptionDescription
     *
     * adds a description to the option
     *
     * @param {DOMElement} _el option leement to add description to
     * @param {String} text description
     *
     * @return _Void_
     */
    addOptionDescription( _el, text )
    {
        let _e = document.createElement( 'div' );
        _e.innerHTML = text;
        _e.className = classes.DESCRIPTION;
        _el.appendChild( _e );
    }


    /**
     * ## addOptionsListeners
     *
     * adds listeners to the options
     *
     * @return _Void_
     */
    addOptionsListeners()
    {
        this.refs.options.forEach( ( _option, i ) =>
        {
            if ( _option.tagName === 'DIV' )
            {
                _option.addEventListener( 'click', this.clickSet );
            }
        } );
    }


    /**
     * ## addSearch
     *
     * checks if a search box is required and attaches it or not
     *
     * @param {Object} flounder main element reference
     *
     * @return _Mixed_ search node or false
     */
    addSearch( flounder )
    {
        if ( this.props.search )
        {
            let search = this.constructElement( {
                                    tagname     : 'input',
                                    type        : 'text',
                                    className   : classes.SEARCH
                                } );
            flounder.appendChild( search );

            return search;
        }

        return false;
    };


    /**
     * ## addSelectKeyListener
     *
     * adds a listener to the selectbox to allow for seeking through the native
     * selectbox on keypress
     *
     * @return _Void_
     */
    addSelectKeyListener()
    {
        let select = this.refs.select;
        select.addEventListener( 'keyup', this.setSelectValue );
        select.addEventListener( 'keydown', this.setKeypress );
        select.focus();
    }


    /**
     * ## bindThis
     *
     * binds this to whatever functions need it.  Arrow functions cannot be used
     * here due to the react extension needing them as well;
     *
     * @return _Void_
     */
    bindThis()
    {
        this.addClass               = this.addClass.bind( this );
        this.attachAttributes       = this.attachAttributes.bind( this );
        this.catchBodyClick         = this.catchBodyClick.bind( this );
        this.checkClickTarget       = this.checkClickTarget.bind( this );
        this.checkFlounderKeypress  = this.checkFlounderKeypress.bind( this );
        this.checkPlaceholder       = this.checkPlaceholder.bind( this );
        this.clickSet               = this.clickSet.bind( this );
        this.displayMultipleTags    = this.displayMultipleTags.bind( this );
        this.fuzzySearch            = this.fuzzySearch.bind( this );
        this.removeMultiTag         = this.removeMultiTag.bind( this );
        this.setIndex               = this.setIndex.bind( this );
        this.setKeypress            = this.setKeypress.bind( this );
        this.setSelectValue         = this.setSelectValue.bind( this );
        this.setValue               = this.setValue.bind( this );
        this.toggleClass            = this.toggleClass.bind( this );
        this.toggleList             = this.toggleList.bind( this );
    }


    /**
     * ## buildDom
     *
     * builds flounder
     *
     * @return _Void_
     */
    buildDom()
    {
        this.refs               = {};

        let constructElement    = this.constructElement;

        let wrapperClass        = classes.MAIN_WRAPPER;
        let wrapper             = this.constructElement( { className : this.wrapperClass ?
                                    wrapperClass + ' ' + this.wrapperClass : wrapperClass } );
        let flounderClass       = classes.MAIN;
        let flounder            = constructElement( { className : this.flounderClass ?
                                    flounderClass + '  ' + this.flounderClass : flounderClass } );

        flounder.tabIndex       = 0;
        wrapper.appendChild( flounder );

        let select              = this.initSelectBox( wrapper );
        select.tabIndex         = -1;

        if ( this.multiple === true )
        {
            select.setAttribute( 'multiple', '' );
        }

        let _options            = this.options;

        let defaultValue        = this._default = this.setDefaultOption( this.props, _options );
console.log( defaultValue );
        let selected            = constructElement( { className : classes.SELECTED_DISPLAYED,
                                        'data-value' : defaultValue.value, 'data-index' : defaultValue.index || -1  } );
            selected.innerHTML  = defaultValue.text;

        let multiTagWrapper     = this.props.multiple ? constructElement( { className : classes.MULTI_TAG_LIST } ) : null;

        if ( multiTagWrapper !== null )
        {
            multiTagWrapper.style.textIndent = this.defaultTextIndent + 'px';
        }

        let arrow               = constructElement( { className : classes.ARROW } );
        let optionsListWrapper  = constructElement( { className : classes.OPTIONS_WRAPPER + '  ' + classes.HIDDEN } );
        let optionsList         = constructElement( { className : classes.LIST } );
        optionsListWrapper.appendChild( optionsList );

        [ selected, multiTagWrapper, arrow, optionsListWrapper ].forEach( _el =>
        {
            if ( _el )
            {
                flounder.appendChild( _el );
            }
        } );

        let search = this.addSearch( flounder );
        let [ options, selectOptions ] = this.buildOptions( defaultValue, _options, optionsList, select );

        this.target.appendChild( wrapper );

        this.refs = { wrapper, flounder, selected, arrow, optionsListWrapper,
                    search, multiTagWrapper, optionsList, select, options, selectOptions };
    }


    /**
     * ## buildOptions
     *
     * builds both the div and select based options. will skip the select box
     * if it already exists
     *
     * @param {Mixed} defaultValue default entry (string or number)
     * @param {Array} _options array with optino information
     * @param {Object} optionsList reference to the div option wrapper
     * @param {Object} select reference to the select box
     *
     * @return _Array_ refs to both container elements
     */
    buildOptions( defaultValue, _options, optionsList, select )
    {
        _options                    = _options || [];
        let options                 = [];
        let selectOptions           = [];
        let constructElement        = this.constructElement;
        let addOptionDescription    = this.addOptionDescription;

        _options.forEach( ( _option, i ) =>
        {
            if ( typeof _option !== 'object' )
            {
                _option = {
                    text    : _option,
                    value   : _option
                };
            }
            _option.index   = i;

            let escapedText = this.escapeHTML( _option.text );
            let extraClass  = i === defaultValue.index ? '  ' + this.selectedClass : '';

            let res = {
                className       : classes.OPTION + extraClass,
                'data-index'    : i
            };

            for ( let _o in _option )
            {
                if ( _o !== 'text' && _o !== 'description' )
                {
                    res[ _o ] = _option[ _o ];
                }
            }

            options[ i ] = constructElement( res );

            options[ i ].innerHTML  = escapedText;
            optionsList.appendChild( options[ i ] );

            let description = _option.description;

            if ( description )
            {
                addOptionDescription( options[ i ], description );
            }

            let uniqueExtraClass    = _option.extraClass;

            if ( uniqueExtraClass )
            {
                options[ i ].className += '  ' + uniqueExtraClass;
            }

            if ( !this.refs.select )
            {
                selectOptions[ i ] = constructElement( { tagname : 'option',
                                            className   : classes.OPTION_TAG,
                                            value       :  _option.value } );
                selectOptions[ i ].innerHTML = escapedText;
                select.appendChild( selectOptions[ i ] );

                if ( i === defaultValue.index )
                {
                    selectOptions[ i ].selected = true;
                }
            }
            else
            {
                let selectChild = select.children[ i ];
                console.log( select );
                selectOptions[ i ] = selectChild;
                selectChild.setAttribute( 'value', selectChild.value );
            }

            if ( selectOptions[ i ].getAttribute( 'disabled' ) )
            {
                this.addClass( options[ i ], classes.DISABLED_OPTION );
            }
        } );

        return  [ options, selectOptions ];
    }


    /**
     * ## catchBodyClick
     *
     * checks if a click is on the menu and, if it isnt, closes the menu
     *
     * @param  {Object} e event object
     *
     * @return _Void_
     */
    catchBodyClick( e )
    {
        if ( ! this.checkClickTarget( e ) )
        {
            this.toggleList( e );
        }
    }


    /**
     * ## checkClickTarget
     *
     * checks whether the target of a click is the menu or not
     *
     * @param  {Object} e event object
     * @param  {DOMElement} target click target
     *
     * @return _Boolean_
     */
    checkClickTarget( e, target )
    {
        target = target || this.refs.options[ e.target.getAttribute( 'data-index' ) ] || e.target;

        if ( target === document )
        {
            return false;
        }
        else if ( target === this.refs.flounder )
        {
            return true;
        }


        return this.checkClickTarget( e, target.parentNode );
    }


    /**
     * ## checkSelect
     *
     * checks if a keypress is a selection
     */
    checkSelect( e )
    {
        if ( !this.toggleList.justOpened )
        {
            switch ( e.keyCode )
            {
                case 13:
                case 27:
                case 32:
                case 38:
                case 40:
                    return true;
            }
        }
        else
        {
            this.toggleList.justOpened = false;
        }

        return false;
    }


    /**
     * ## checkFlounderKeypress
     *
     * checks flounder focused keypresses and filters all but space and enter
     *
     * @return _Void_
     */
    checkFlounderKeypress( e )
    {
        if ( e.keyCode === 13 || e.keyCode === 32 )
        {
            e.preventDefault();
            this.toggleList( e );
        }
    }


    /**
     * ## checkPlaceholder
     *
     * clears or readds the placeholder
     *
     * @param {Object} e event object
     *
     * @return _Void_
     */
    checkPlaceholder( e )
    {
        let type = e.type;
        let refs = this.refs;

        if ( type === 'focus' )
        {
            refs.selected.innerHTML = '';
        }
        else
        {
            if ( refs.multiTagWrapper &&
                    refs.multiTagWrapper.children.length === 0 )
            {
                this.refs.selected.innerHTML = this._default.text;
            }
        }
    }


    /**
     * ## clickSet
     *
     * when a flounder option is clicked on it needs to set the option as selected
     *
     * @param {Object} e event object
     *
     * @return _Void_
     */
    clickSet( e )
    {
        this.setSelectValue( {}, e );

        if ( !this.multiple || !e[ this.multiSelect ] )
        {
            this.toggleList( e );
        }
    }


    /**
     * ## componentWillUnmount
     *
     * on unmount, removes events
     *
     * @return _Void_
     */
    componentWillUnmount()
    {
        let props       = this.props;
        let refs        = this.refs;

        let _events     = props.events;
        let _div        = refs.flounder;

        for ( let _event in _events )
        {
            _div.removeEventListener( _event, _events[ _event ] );
        }

        this.removeOptionsListeners();

        refs.selected.removeEventListener( 'click', this.toggleList );

        if ( props.search )
        {
            let search = refs.search;
            search.removeEventListener( 'click', this.toggleList );
            search.removeEventListener( 'keyup', this.fuzzySearch );
        }
    }


    /**
     * ## deselectAll
     *
     * deslects all options
     *
     * @return _Void_
     */
    deselectAll()
    {
        this.removeSelectedClass();
        this.removeSelectedValue();
    }


    /**
     * ## destroy
     *
     * removes flounder and all it's events from the dom
     *
     * @return _Void_
     */
    destroy()
    {
        this.componentWillUnmount();
        let originalTarget  = this.originalTarget;

        if ( originalTarget.tagName === 'INPUT' || originalTarget.tagName === 'SELECT' )
        {
            let target = originalTarget.nextElementSibling;
            target.parentNode.removeChild( target );
            originalTarget.tabIndex = 0;
            this.removeClass( originalTarget, classes.HIDDEN );
        }
        else
        {
            let target          = this.target;
            target.innerHTML    = '';
        }
    }


    /**
     * ## disable
     *
     * disables flounder by adjusting listeners and classes
     *
     * @param {Boolean} bool dsable or enable
     *
     * @return _Void_
     */
    disable( bool )
    {
        let refs        = this.refs;
        let flounder    = refs.flounder;
        let selected    = refs.selected;

        if ( bool )
        {
            refs.flounder.removeEventListener( 'keydown', this.checkFlounderKeypress );
            refs.selected.removeEventListener( 'click', this.toggleList );
            this.addClass( selected, classes.DISABLED );
            this.addClass( flounder, classes.DISABLED );
        }
        else
        {
            refs.flounder.addEventListener( 'keydown', this.checkFlounderKeypress );
            refs.selected.addEventListener( 'click', this.toggleList );
            this.removeClass( selected, classes.DISABLED );
            this.removeClass( flounder, classes.DISABLED );
        }
    }


    /**
     * ## displayMultipleTags
     *
     * handles the display and management of multiple choice tage
     *
     * @param  {Array} selectedOptions currently selected options
     * @param  {DOMElement} selected div to display currently selected options
     *
     * @return _Void_
     */
    displayMultipleTags( selectedOptions, multiTagWrapper )
    {
        let _span, _a;

        let removeMultiTag = this.removeMultiTag

        Array.prototype.slice.call( multiTagWrapper.children ).forEach( function( el )
        {
            el.firstChild.removeEventListener( 'click', removeMultiTag );
        } );

        multiTagWrapper.innerHTML = '';

        selectedOptions.forEach( function( option )
        {
            if ( option.value !== '' )
            {
                _span           = document.createElement( 'span' )
                _span.className = classes.MULTIPLE_SELECT_TAG;

                _a              = document.createElement( 'a' )
                _a.className    = classes.MULTIPLE_TAG_CLOSE;
                _a.setAttribute( 'data-index', option.index );

                _span.appendChild( _a );

                _span.innerHTML += option.innerHTML;

                multiTagWrapper.appendChild( _span );
            }
            else
            {
                option.selected = false;
            }
        } );

        this.setTextMultiTagIndent();

        Array.prototype.slice.call( multiTagWrapper.children ).forEach( function( el )
        {
            el.firstChild.addEventListener( 'click', removeMultiTag );
        } );
    }


    /**
     * ## displaySelected
     *
     * formats and displays the chosen options
     *
     * @param {DOMElement} selected display area for the selected option(s)
     * @param {Object} refs element references

     */
    displaySelected( selected, refs )
    {
        console.log( this );
        let value = [];
        let index = -1;

        let selectedOption  = this.getSelectedOptions();

        let selectedLength  = selectedOption.length;

        if ( !this.multiple || ( !this.multipleTags && selectedLength ===  1 ) )
        {
            index               = selectedOption[0].index;
            selected.innerHTML  = selectedOption[0].innerHTML;
            value               = selectedOption[0].value;
        }
        else if ( selectedLength === 0 )
        {
            let defaultValue = this._default;

            index               = defaultValue.index || -1;
            selected.innerHTML  = defaultValue.text;
            value               = defaultValue.value;
        }
        else
        {
            if ( this.multipleTags )
            {
                selected.innerHTML  = '';
                this.displayMultipleTags( selectedOption, this.refs.multiTagWrapper );
            }
            else
            {
                selected.innerHTML  = this.multipleMessage;
            }

            index = selectedOption.map( function( option )
            {
                return option.index;
            } );

            value = selectedOption.map( function( option )
            {
                return option.value;
            } );
        }

        selected.setAttribute( 'data-value', value );
        selected.setAttribute( 'data-index', index );
    }


    /**
     * ## fuzzySearch
     *
     * searches each option element to see whether it contains a string
     *
     * @param {Object} e event object
     *
     * @return _Void_
     */
    fuzzySearch( e ) // disclaimer: not actually fuzzy
    {
        e.preventDefault();
        let keyCode = e.keyCode;

        if ( keyCode !== 38 && keyCode !== 40 &&
                keyCode !== 13 && keyCode !== 27 )
        {
            let term        = e.target.value.toLowerCase();

            this.refs.options.forEach( _option =>
            {
                let text    = _option.innerHTML.toLowerCase();

                if ( term !== '' && text.indexOf( term ) === -1 )
                {
                    this.addClass( _option, classes.SEARCH_HIDDEN );
                }
                else
                {
                    this.removeClass( _option, classes.SEARCH_HIDDEN );
                }
            } );
        }
        else
        {
            this.setKeypress( e );
            this.setSelectValue( e );
        }
    }


    /**
     * ## fuzzySearchReset
     *
     * resets all options to visible
     *
     * @return _Void_
     */
    fuzzySearchReset()
    {
        this.refs.options.forEach( _option =>
        {
            this.removeClass( _option, classes.SEARCH_HIDDEN );
        } );

        this.refs.search.value = '';
    }


    /**
     * ## getActualWidth
     *
     * gets the width adjusted for margins
     *
     * @param {DOMElement} _el target element
     *
     * @return _Integer_ adjusted width
     */
    getActualWidth( _el )
    {
        let style = getComputedStyle( _el );

        if ( _el.offsetWidth === 0 )
        {
            if ( this.__checkWidthAgain !== true )
            {
                setTimeout( this.setTextMultiTagIndent.bind( this ), 1500 );
                this.__checkWidthAgain === true;
            }
        }
        else
        {
            this.__checkWidthAgain !== false
        }

        return _el.offsetWidth + parseInt( style[ 'margin-left' ] ) +
                                parseInt( style[ 'margin-right' ] );
    }


    /**
     * ## getOption
     *
     * returns the option and div tags related to an option
     *
     * @param {Number} _i index to return
     *
     * @return _Object_ option and div tage
     */
    getOption( _i )
    {
        let refs = this.refs;

        return { option : refs.selectOptions[ _i ], div : refs.options[ _i ] };
    }


    /**
     * ## getSelectedOptions
     *
     * returns the currently selected options of a SELECT box
     *
     * @return _Void_
     */
    getSelectedOptions()
    {
        let _el         = this.refs.select;
        let opts        = [], opt;
        let _options    = _el.options;

        for ( let i = 0, len = _options.length; i < len; i++ )
        {
            opt = _options[ i ];

            if ( opt.selected )
            {
                opts.push( opt );
            }
        }

        return opts;
    }


    /**
     * ## getSelectedValues
     *
     * returns the values of the currently selected options
     *
     * @return _Void_
     */
    getSelectedValues()
    {
        return this.getSelectedOptions().map( ( _v ) => _v.value )
    }


    /**
     * hideElement
     *
     * hides an element offscreen
     *
     * @param {Object} _el element to hide
     *
     * @return _Void_
     */
    hideElement( _el )
    {
        this.addClass( _el, classes.HIDDEN );
    }


    /**
     * ## initialzeOptions
     *
     * inserts the initial options into the flounder object, setting defaults when necessary
     *
     * @return _Void_
     */
    initialzeOptions()
    {
        this.props                  = this.props || {};
        let props                   = this.props;

        for ( var _o in defaultOptions )
        {
            if ( defaultOptions.hasOwnProperty( _o ) && _o !== 'classes' )
            {
                this[ _o ] = props[ _o ] !== undefined ? props[ _o ] : defaultOptions[ _o ];
            }
            else if ( _o === 'classes' )
            {
                let classes         = defaultOptions[ _o ];
                let propsClasses    = props.classes;

                for ( var _c in classes )
                {
                    this[ _c + 'Class' ] = propsClasses && propsClasses[ _c ] !== undefined ? propsClasses[ _c ] : classes[ _c ];
                }
            }
        }

        if ( !this.multiple )
        {
            this.multipleTags = false;
        }

        if ( this.multipleTags )
        {
            this.selectedClass += '  ' + classes.SELECTED_HIDDEN;
        }
    }


    /**
     * ## initSelectBox
     *
     * builds the initial select box.  if the given wrapper element is a select
     * box, this instead scrapes that, thus allowing php fed elements
     *
     * @param {DOMElement} wrapper main wrapper element
     *
     * @return _DOMElement_ select box
     */
    initSelectBox( wrapper )
    {
        let target = this.target;
        let select;

        if ( target.tagName === 'SELECT' )
        {
            this.addClass( target, classes.SELECT_TAG );
            this.addClass( target, classes.HIDDEN );
            this.refs.select    = target;

            let options = [], selectOptions = [];
            Array.prototype.slice.apply( target.children ).forEach( function( optionEl )
            {
                selectOptions.push( optionEl );
                options.push( {
                    text    : optionEl.innerHTML,
                    value   : optionEl.value
                } );
            } );

            this.options            = options;
            this.target             = target.parentNode;
            this.refs.selectOptions = selectOptions;

            select = this.refs.select;
            this.addClass( select, classes.HIDDEN );
        }
        else
        {
            select = this.constructElement( { tagname : 'select', className : classes.SELECT_TAG + '  ' + classes.HIDDEN } );
            wrapper.appendChild( select );
        }

        return select;
    }


    /**
     * ## onRender
     *
     * attaches necessary events to the built DOM
     *
     * @return _Void_
     */
    onRender()
    {
        let props   = this.props;
        let refs    = this.refs;
        let options = refs.options;

        if ( !!this.isIos && ( !this.multipleTags || !this.multiple )  )
        {
            let sel     = refs.select;
            this.removeClass( sel, classes.HIDDEN );
            this.addClass( sel, classes.HIDDEN_IOS );
        }


        let self    = this;
        var _divertTarget = function( e )
        {
            var index   = this.selectedIndex;
            var _e      = {
                target          : refs.options[ index ]
            };

            self.setSelectValue( _e );

            if ( !self.multiple )
            {
                self.toggleList( e, 'close' );
            }
        };


        refs.select.addEventListener( 'change', _divertTarget  );

        this.addOptionsListeners();

        refs.flounder.addEventListener( 'keydown', this.checkFlounderKeypress );
        refs.selected.addEventListener( 'click', this.toggleList );

        if ( props.search )
        {
            let search = refs.search;
            search.addEventListener( 'click', this.toggleList );
            search.addEventListener( 'keyup', this.fuzzySearch );
            search.addEventListener( 'focus', this.checkPlaceholder );
            search.addEventListener( 'blur', this.checkPlaceholder );
        }
    }


    /**
     * ## rebuildOptions
     *
     * after editing the options, this can be used to rebuild them
     *
     * @param {Array} _options array with optino information
     *
     * @return _Void_
     */
    rebuildOptions( _options )
    {
        let refs        = this.refs;
        let selected    = refs.select.selectedOptions;
        selected        = Array.prototype.slice.call( selected ).map( function( e ){ return e.value; } );
        this.removeOptionsListeners();

        refs.select.innerHTML       = '';
        refs.optionsList.innerHTML  = '';

        let _select                 = refs.select;
        refs.select                 = false;
        [ refs.options, refs.selectOptions ] = this.buildOptions( this._default, _options, refs.optionsList, _select );
        refs.select                 = _select;

        this.removeSelectedValue();
        this.removeSelectedClass();

        refs.selectOptions.forEach( ( el, i ) =>
        {
            let valuePosition = selected.indexOf( el.value );

            if ( valuePosition !== -1 )
            {
                selected.splice( valuePosition, 1 );
                el.selected = true;
                this.addClass( refs.options[ i ], this.selectedClass );
            }
        } );

        this.addOptionsListeners();
    }


    /**
     * ## removeOptionsListeners
     *
     * removes event listeners on the options divs
     *
     * @return _Void_
     */
    removeOptionsListeners()
    {
        this.refs.options.forEach( _option =>
        {
            if ( _option.tagName === 'DIV' )
            {
                _option.removeEventListener( 'click', this.clickSet );
            }
        } );
    }


    /**
     * ## removeMultiTag
     *
     * removes a multi selection tag on click; fixes all references to value and state
     *
     * @param  {Object} e event object
     *
     * @return _Void_
     */
    removeMultiTag( e )
    {
        e.preventDefault();
        e.stopPropagation();

        let value;
        let index;
        let refs            = this.refs;
        let select          = refs.select;
        let selected        = refs.selected;
        let target          = e.target;
        let defaultValue    = this._default;
        let targetIndex     = target.getAttribute( 'data-index' );
        select[ targetIndex ].selected = false;

        let selectedOptions = this.getSelectedOptions();

        this.removeClass( refs.options[ targetIndex ], classes.SELECTED_HIDDEN );
        this.removeClass( refs.options[ targetIndex ], classes.SELECTED );

        let span = target.parentNode;
        span.parentNode.removeChild( span );

        if ( selectedOptions.length === 0 )
        {
            index               = defaultValue.index || -1;
            selected.innerHTML  = defaultValue.text;
            value               = defaultValue.value;
        }
        else
        {
            value = selectedOptions.map( function( option )
            {
                return option.value;
            } );

            index = selectedOptions.map( function( option )
            {
                return option.index;
            } );
        }

        this.setTextMultiTagIndent();

        selected.setAttribute( 'data-value', value );
        selected.setAttribute( 'data-index', index );

        this.onSelect( e, this.getSelectedValues() );
    }


    /**
     * ## removeSelectKeyListener
     *
     * disables the event listener on the native select box
     *
     * @return _Void_
     */
    removeSelectKeyListener()
    {
        let select = this.refs.select;
        select.removeEventListener( 'keyup', this.setSelectValue );
    }


    /**
     * ## removeSelectedClass
     *
     * removes the [[this.selectedClass]] from all options
     *
     * @return _Void_
     */
    removeSelectedClass( options )
    {
        options = options || this.refs.options;

        options.forEach( ( _option, i ) =>
        {
            this.removeClass( _option, this.selectedClass );
        } );
    }


    /**
     * ## removeSelectedValue
     *
     * sets the selected property to false for all options
     *
     * @return _Void_
     */
    removeSelectedValue( options )
    {
        options = options || this.refs.options;

        options.forEach( ( _option, i ) =>
        {
            this.refs.select[ i ].selected = false;
        } );
    }


    /**
     * ## setDefaultOption
     *
     * sets the initial default value
     *
     * @param {String or Number}    defaultProp         default passed from this.props
     * @param {Object}              options             this.props.options
     *
     * @return _Void_
     */
    setDefaultOption( configObj, options )
    {
        if ( configObj.placeholder )
        {
            let refs        = this.refs;
            let select      = refs.select;

            let _default    = {
                text        : configObj.placeholder,
                value       : '',
                index       : 0,
                extraClass  : classes.HIDDEN
            };

            if ( select )
            {
                let escapedText     = this.escapeHTML( _default.text );
                let defaultOption   = this.constructElement( { tagname : 'option',
                                            className   : classes.OPTION_TAG,
                                            value       :  _default.value } );
                defaultOption.innerHTML = escapedText;

                select.insertBefore( defaultOption, select[0] );
                this.refs.selectOptions.unshift( defaultOption );
            }

            options.unshift( _default );

            return _default;
        }
        else if ( configObj.defaultIndex )
        {
            let defaultIndex        = configObj.defaultIndex;
            let defaultOption       = options[ defaultIndex ]

            if ( defaultOption )
            {
                defaultOption.index   = defaultIndex;
                return defaultOption;
            }

            return null;
        }
        else if ( configObj.defaultValue )
        {
            let defaultProp = configObj.defaultValue + '';
            let index;

            options.forEach( function( opt, i )
            {
                if ( opt.value === defaultProp )
                {
                    index = i;
                }
            } );

            let _default = index ? options[ index ] : null;

            if ( _default )
            {
                _default.index = index;
                return _default;
            }

            return null;
        }
    }


    /**
     * ## setIndex
     *
     * programatically sets the value by index.  If there are not enough elements
     * to match the index, then nothing is selected.
     *
     * @param {Mixed} index index to set flounder to.  _Number, or Array of numbers_
     *
     * return _Void_
     */
    setIndex( index, multiple )
    {
        let refs = this.refs;

        if ( typeof index !== 'string' && index.length )
        {
            let _setIndex = this.setIndex;
            return index.map( _setIndex );
        }
        else
        {
            var el = refs.options[ index ];

            if ( el )
            {
                let isOpen = this.hasClass( refs.wrapper, 'open' );
                this.toggleList( isOpen ? 'close' : 'open' );
                this.___forceMultiple = multiple;
                el.click();

                return el;
            }

            return null;
        }
    }


    /**
     * ## setKeypress
     *
     * handles arrow key selection
     *
     * @param {Object} e event object
     *
     * @return _Void_
     */
    setKeypress( e )
    {
        e.preventDefault();
        let increment   = 0;
        let keyCode     = e.keyCode;

        if ( this.multipleTags )
        {
            return false;
        }

        if ( keyCode === 13 || keyCode === 27 || keyCode === 32 )
        {
            this.toggleList( e );
            return false;
        }
        else if ( keyCode === 38 )
        {
            e.preventDefault();
            increment--;
        }
        else if ( keyCode === 40 )
        {
            e.preventDefault();
            increment++;
        }


        if ( !!window.sidebar ) // ff
        {
            increment = 0;
        }

        let refs                = this.refs;
        let selectTag           = refs.select;
        let options             = refs.options;
        let optionsMaxIndex     = options.length - 1;
        let index               = selectTag.selectedIndex + increment;

        if ( index > optionsMaxIndex )
        {
            index = 0;
        }
        else if ( index < 0 )
        {
            index = optionsMaxIndex;
        }

        selectTag.selectedIndex = index;
        let hasClass            = this.hasClass;

        if ( hasClass( options[ index ], classes.HIDDEN ) &&
             hasClass( options[ index ], classes.SELECTED_HIDDEN ) )
        {
            this.setKeypress( e );
        }
    }


    /**
     * ## setPlatform
     *
     * sets the platform to osx or not osx for the sake of the multi select key
     *
     * @return _Void_
     */
    setPlatform()
    {
        let _osx = this.isOsx = window.navigator.platform.indexOf( 'Mac' ) === -1 ? false : true;

        this.isIos          = this.iosVersion();
        this.multiSelect    = _osx ? 'metaKey' : 'ctrlKey';
    }


    /**
     * ## setSelectValue
     *
     * sets the selected value in flounder.  when activated by a click, the event
     * object is moved to the second variable.  this gives us the ability to
     * discern between triggered events (keyup) and processed events (click)
     * for the sake of choosing our targets
     *
     * @param {Object} obj possible event object
     * @param {Object} e event object
     *
     * @return _Void_
     */
    setSelectValue( obj, e )
    {
        let refs        = this.refs;
        let selection;

        if ( e ) // click
        {
            this.setSelectValueClick( e );
            selection = true;
        }
        else // keypress
        {
            if ( this.multipleTags )
            {
                obj.preventDefault();
                obj.stopPropagation();

                return false;
            }

            selection = this.checkSelect( obj );

            if ( selection )
            {
                this.setSelectValueButton( obj );
            }
        }

        if ( selection )
        {
            this.displaySelected( refs.selected, refs );

            this.onSelect( e, this.getSelectedValues() );
        }
    }


    /**
     * ## setSelectValueButton
     *
     * processes the setting of a value after a keypress event
     *
     * @return _Void_
     */
    setSelectValueButton()
    {
        let refs            = this.refs;
        let options         = refs.options;
        let select          = refs.select;
        let selectedClass   = this.selectedClass;

        let selectedOption;

        this.removeSelectedClass( options );

        let optionsArray    = this.getSelectedOptions();
        let baseOption      = optionsArray[ 0 ];

        if ( baseOption )
        {
            selectedOption  = options[ baseOption.index ];

            this.addClass( selectedOption, selectedClass );

            this.scrollTo( selectedOption );
        }
    }


    /**
     * ## setSelectValueClick
     *
     * processes the setting of a value after a click event
     *
     * @param {Object} e event object
     *
     * @return _Void_
     */
    setSelectValueClick( e )
    {
        let _multiple       = this.multiple;
        let refs            = this.refs;
        let options         = refs.options;
        let selectedClass   = this.selectedClass;
        let index, selectedOption;

        if ( ( !_multiple ||  _multiple && !this.multipleTags && !e[ this.multiSelect ] ) && !this.___forceMultiple )
        {
            this.deselectAll();
        }

        this.___forceMultiple   = false;
        let target              = e.target;

        this.toggleClass( target, selectedClass );
        index                   = target.getAttribute( 'data-index' );

        selectedOption          = refs.selectOptions[ index ];

        selectedOption.selected = selectedOption.selected === true ? false : true;
    }


    /**
     * ## setTextMultiTagIndent
     *
     * sets the text-indent on the search field to go around selected tags
     *
     * @return _Void_
     */
    setTextMultiTagIndent()
    {
        let search = this.refs.search;
        let offset = this.defaultTextIndent;

        if ( search )
        {
            let _els = document.getElementsByClassName( classes.MULTIPLE_SELECT_TAG );
            _els.each( ( i, e ) =>
            {
                offset += this.getActualWidth( e );
            } );

            search.style.textIndent = offset + 'px';
        }
    }


    /**
     * ## setValue
     *
     * programatically sets the value by string.  If the value string
     * is not matched to an element, nothing will be selected
     *
     * @param {Mixed} value value to set flounder to.  _Number, or Array of numbers_
     *
     * return _Void_
     */
    setValue( value, multiple )
    {
        if ( typeof value !== 'string' && value.length )
        {
            let _setValue = this.setValue;
            return value.map( _setValue );
        }
        else
        {
            value = this.refs.select.querySelector( '[value="' + value + '"]' );
            return value ? this.setIndex( value.index, multiple ) : null;
        }
    }


    /**
     * ## showElement
     *
     * remove classes.HIDDEN from a given element
     *
     * @param {Object} _el element to show
     *
     * @return _Void_
     */
    showElement( _el )
    {
        this.removeClass( _el, classes.HIDDEN );
    }


    /**
     * ## toggleList
     *
     * on click of flounder--selected, this shows or hides the options list
     *
     * @param {String} force toggle can be forced by passing 'open' or 'close'
     *
     * @return _Void_
     */
    toggleList( e, force )
    {
        let refs        = this.refs;
        let optionsList = refs.optionsListWrapper;
        let wrapper     = refs.wrapper;
        let hasClass    = this.hasClass;

        if ( force === 'open' || force !== 'close' && hasClass( optionsList, classes.HIDDEN ) )
        {
            this.toggleList.justOpened = true;
            this.toggleOpen( e, optionsList, refs, wrapper );
        }
        else if ( force === 'close' || !hasClass( optionsList, classes.HIDDEN ) )
        {
            this.toggleList.justOpened = false;
            this.toggleClosed( e, optionsList, refs, wrapper );
        }
    }


    /**
     * ## toggleOpen
     *
     * post toggleList, this runs it the list should be opened
     *
     * @param {Object} e event object
     * @param {DOMElement} optionsList the options list
     * @param {Object} refs contains the references of the elements in flounder
     * @param {DOMElement} wrapper wrapper of flounder
     *
     * @return _Void_
     */
    toggleOpen( e, optionsList, refs, wrapper )
    {
        this.addSelectKeyListener();

        if ( !this.isIos || ( this.multipleTags === true && this.multiple === true ) )
        {
            this.showElement( optionsList );
            this.addClass( wrapper, 'open' );

            document.querySelector( 'html' ).addEventListener( 'click', this.catchBodyClick );
            document.querySelector( 'html' ).addEventListener( 'touchend', this.catchBodyClick );
        }


        if ( !this.multiple )
        {
            let index       = refs.select.selectedIndex;
            let selectedDiv = refs.options[ index ];

            if ( selectedDiv )
            {
                this.scrollTo( selectedDiv  );
            }
        }

        if ( this.props.search )
        {
            refs.search.focus();
        }

        this.onOpen( e, this.getSelectedValues() );
    }



    /**
     * ## toggleClosed
     *
     * post toggleList, this runs it the list should be closed
     *
     * @param {Object} e event object
     * @param {DOMElement} optionsList the options list
     * @param {Object} refs contains the references of the elements in flounder
     * @param {DOMElement} wrapper wrapper of flounder
     *
     * @return _Void_
     */
    toggleClosed( e, optionsList, refs, wrapper )
    {
        this.hideElement( optionsList );
        this.removeSelectKeyListener();
        this.removeClass( wrapper, 'open' );

        let qsHTML = document.querySelector( 'html' );
        qsHTML.removeEventListener( 'click', this.catchBodyClick );
        qsHTML.removeEventListener( 'touchend', this.catchBodyClick );

        if ( this.props.search )
        {
            this.fuzzySearchReset();
        }

        refs.flounder.focus();

        this.onClose( e, this.getSelectedValues() );
    }
}

utils.extendClass( Flounder, utils );

export default Flounder;

