/* globals document */
import { setDefaultOption }     from './defaults';
import utils                    from './utils';

const nativeSlice = Array.prototype.slice;

const build = {

    /**
     * ## addOptionDescription
     *
     * adds a description to the option
     *
     * @param {DOMElement} el option element to add description to
     * @param {String} text description
     * @param {String} CSS class to apply
     *
     * @return {Void} void
     */
    addOptionDescription( el, text )
    {
        const div         = document.createElement( 'div' );
        div.innerHTML   = text;
        div.className   = this.classes.DESCRIPTION;
        el.appendChild( div );
    },


    /**
     * ## addSearch
     *
     * checks if a search box is required and attaches it or not
     *
     * @param {Object} node next sibling to mount the input to
     * @param {Object} flounder main element reference
     *
     * @return {Mixed} search node or false
     */
    addSearch( node )
    {
        if ( this.search )
        {
            const classes = this.classes;
            const search  = utils.constructElement( {
                tagname     : 'input',
                type        : 'text',
                className   : classes.SEARCH
            } );

            node.appendChild( search );

            return search;
        }

        return false;
    },


    /**
     * ## bindThis
     *
     * binds this to whatever functions need it.  Arrow functions cannot be used
     * here due to the react extension needing them as well;
     *
     * @return {Void} void
     */
    bindThis()
    {
        [
            'addHoverClass',
            'catchBodyClick',
            'checkClickTarget',
            'checkFlounderKeypress',
            'checkMultiTagKeydown',
            'clearPlaceholder',
            'clickSet',
            'divertTarget',
            'displayMultipleTags',
            'firstTouchController',
            'fuzzySearch',
            'removeHoverClass',
            'removeMultiTag',
            'setKeypress',
            'setSelectValue',
            'toggleList',
            'toggleListSearchClick'
        ].forEach( func =>
        {
            this[ func ] = this[ func ].bind( this );
            this[ func ].isBound = true;
        } );
    },

    /**
     * ## buildArrow
     *
     * builds the arrow and the
     *
     * @param {Object} props property object
     * @param {Function} constructElement ref to this.constructElement
     *
     * @return {DOMElement} arrow
     */
    buildArrow( props, constructElement )
    {
        if (  props.disableArrow )
        {
            return false;
        }

        const classes     = this.classes;
        const arrow       = constructElement( {
            className : classes.ARROW
        } );

        const arrowInner  = constructElement( {
            className : classes.ARROW_INNER
        } );

        arrow.appendChild( arrowInner );

        return arrow;
    },


    /**
     * ## buildData
     *
     * builds both the div and select based options. will skip the select box
     * if it already exists
     *
     * @param {Mixed} defaultValue default entry (string or number)
     * @param {Array} originalData array with optino information
     * @param {Object} optionsList reference to the div option wrapper
     * @param {Object} select reference to the select box
     *
     * @return {Array} refs to both container elements
     */
    buildData( defaultValue, originalData, optionsList, select )
    {
        const self              = this;
        let index               = 0;
        const data              = [];
        const selectOptions     = [];
        const constructElement  = utils.constructElement;
        const selectedClass     = this.selectedClass;
        const escapeHTML        = utils.escapeHTML;
        const addClass          = utils.addClass;
        const refs              = this.refs;
        const selectRef         = refs.select;
        const allowHTML         = this.allowHTML;
        const classes           = this.classes;

        /**
         * ## buildDiv
         *
         * builds an individual div tag for a flounder dropdown
         *
         * @param {Object} dataObj data object
         * @param {Number} i index
         *
         * @return {DOMElement} built div
         */
        function buildDiv( dataObj, i )
        {
            dataObj.index   = i;

            const extraClass  = i === defaultValue.index ?
                                                    `  ${selectedClass}` : '';

            const res = {
                className       : classes.OPTION + extraClass,
                'data-index'    : i
            };

            for ( const o in dataObj )
            {
                if ( o !== 'text' && o !== 'description' )
                {
                    res[ o ] = dataObj[ o ];
                }
            }

            const data        = constructElement( res );
            data.innerHTML  = allowHTML ? dataObj.text :
                                            escapeHTML( dataObj.text );

            if ( dataObj.description )
            {
                self.addOptionDescription( data, dataObj.description,
                                                        classes.DESCRIPTION );
            }

            data.className += dataObj.extraClass ?
                                                `  ${dataObj.extraClass}` : '';

            data.setAttribute( 'role', 'option' );

            return data;
        }


        /**
         * ## buildOption
         *
         * builds an individual option tag for a flounder dropdown
         *
         * @param {Object} dataObj option build properties
         * @param {Number} i index
         *
         * @return {DOMElement} build option tag
         */
        function buildOption( dataObj, i )
        {
            let selectOption;

            if ( !selectRef )
            {
                const extra             = dataObj.extraClass || '';
                const selectOptionClass = `${classes.OPTION_TAG}  ${extra}`;

                selectOption            = constructElement( {
                    tagname     : 'option',
                    className   : selectOptionClass.trim(),
                    value       : dataObj.value
                } );

                const escapedText         = escapeHTML( dataObj.text );
                selectOption.innerHTML  = escapedText;

                const disabled            = dataObj.disabled;

                if ( disabled )
                {
                    selectOption.setAttribute( 'disabled', disabled );
                }

                select.appendChild( selectOption );
            }
            else
            {
                const selectChild     = selectRef.children[ i ];
                selectOption        = selectChild;
                selectChild.setAttribute( 'value', selectChild.value );

                if ( selectChild.disabled === true && data[ i ] )
                {
                    addClass( data[ i ], classes.DISABLED );
                }

                addClass( selectChild, classes.OPTION_TAG );
            }

            if ( i === defaultValue.index )
            {
                selectOption.selected = true;
            }


            if ( selectOption.getAttribute( 'disabled' ) )
            {
                addClass( data[ i ], classes.DISABLED );
            }

            return selectOption;
        }



        originalData.forEach( ( dataObj, i ) =>
        {
            /* istanbul ignore next */
            if ( typeof dataObj !== 'object' )
            {
                dataObj = originalData[ i ] = {
                    text    : dataObj,
                    value   : dataObj
                };
            }

            if ( dataObj.header )
            {
                const section = constructElement( {
                    tagname     : 'div',
                    className   : classes.SECTION
                } );

                const header  = constructElement( {
                    tagname     : 'div',
                    className   : classes.HEADER
                } );

                header.textContent = dataObj.header;
                section.appendChild( header );
                optionsList.appendChild( section );

                const dataObjData = dataObj.data;
                dataObjData.forEach( ( d, i ) =>
                {
                    /* istanbul ignore next */
                    if ( typeof d !== 'object' )
                    {
                        d = dataObjData[ i ] = {
                            text    : d,
                            value   : d
                        };
                    }

                    data[ index ]           = buildDiv( d, index );
                    section.appendChild( data[ index ] );
                    selectOptions[ index ]  = buildOption( d, index );
                    index++;
                } );
            }
            else
            {
                data[ index ]           = buildDiv( dataObj, index );
                optionsList.appendChild( data[ index ] );
                selectOptions[ index ]  = buildOption( dataObj, index );
                index++;
            }
        } );

        return  [ data, selectOptions ];
    },


    /**
     * ## buildDom
     *
     * builds flounder
     *
     * @return {Void} void
     */
    buildDom()
    {
        const props             = this.props;
        const classes           = this.classes;
        this.refs               = {};

        const constructElement  = utils.constructElement;

        const wrapper           = utils.constructElement( {
            className : classes.MAIN_WRAPPER
        } );

        const flounderClass     = classes.MAIN;

        const flounderClasses   = this.multipleTags ?
                        `${flounderClass} ${classes.MULTIPLE_TAG_FLOUNDER}` :
                        flounderClass;

        const flounder          = constructElement( {
            className : flounderClasses
        } );

        flounder.setAttribute( 'aria-hidden', true );
        flounder.tabIndex       = 0;
        wrapper.appendChild( flounder );

        const select        = this.initSelectBox( wrapper );
        select.tabIndex     = -1;

        let data            = this.data;

        this.defaultObj     = setDefaultOption( this, this.props, data );
        const defaultValue  = this.defaultObj;

        const selected      = constructElement( {
            className       : classes.SELECTED_DISPLAYED,
            'data-value'    : defaultValue.value,
            'data-index'    : defaultValue.index
        } );

        const multiTagWrapper   = this.multipleTags ? constructElement( {
            className : classes.MULTI_TAG_LIST
        } ) : null;

        const optionsListWrapper = constructElement( {
            className : `${classes.OPTIONS_WRAPPER}  ${classes.HIDDEN}`
        } );

        const optionsList       = constructElement( {
            className : classes.LIST
        } );

        optionsList.setAttribute( 'role', 'listbox' );
        optionsListWrapper.appendChild( optionsList );

        if ( this.multiple === true )
        {
            select.setAttribute( 'multiple', '' );
            optionsList.setAttribute( 'aria-multiselectable', 'true' );
        }

        const arrow = this.buildArrow( props, constructElement );

        [ selected, multiTagWrapper, optionsListWrapper, arrow ].forEach( el =>
        {
            if ( el )
            {
                flounder.appendChild( el );
            }
        } );

        const searchLocation    = multiTagWrapper || flounder;

        const search            = this.addSearch( searchLocation );


        const built = this.buildData( defaultValue, data, optionsList, select );

        data                = built[ 0 ];
        const selectOptions = built[ 1 ];

        this.target.appendChild( wrapper );

        this.refs = {
            wrapper,
            flounder,
            selected,
            arrow,
            optionsListWrapper,
            search,
            multiTagWrapper,
            optionsList,
            select,
            data,
            selectOptions
        };

        if ( this.multipleTags )
        {
            const selectedOptions = this.getSelected();

            if ( selectedOptions.length === 0 )
            {
                selected.innerHTML = defaultValue.text;
            }
            else
            {
                this.displayMultipleTags( selectedOptions, multiTagWrapper );
            }
        }
        else
        {
            selected.innerHTML = defaultValue.text;
        }
    },


    /**
     * ## buildMultiTag
     *
     * builds and returns a single multiTag
     *
     * @param {String} option tag to grab text to add to the tag and role
     *
     * @return {DOMElement} option tag
     */
    buildMultiTag( option )
    {
        const classes    = this.classes;
        const optionText = option.innerHTML;
        const span       = document.createElement( 'SPAN' );
        span.className   = classes.MULTIPLE_SELECT_TAG;
        span.setAttribute( 'aria-label', 'Close' );
        span.setAttribute( 'tabindex', 0 );

        const a         = document.createElement( 'A' );
        a.className     = classes.MULTIPLE_TAG_CLOSE;
        a.setAttribute( 'data-index', option.index );

        span.appendChild( a );

        span.innerHTML += optionText;

        return span;
    },


    /**
     * ## initSelectBox
     *
     * builds the initial select box.  if the given wrapper element is a select
     * box, this instead scrapes that, thus allowing php fed elements
     *
     * @param {DOMElement} wrapper main wrapper element
     *
     * @return {DOMElement} select box
     */
    initSelectBox( wrapper )
    {
        const target  = this.target;
        const refs    = this.refs;
        let select    = refs.select;
        const classes = this.classes;

        if ( target.tagName === 'SELECT' )
        {
            utils.addClass( target, classes.SELECT_TAG );
            utils.addClass( target, classes.HIDDEN );

            select = target;

            if ( !this.props.keepChangesOnDestroy )
            {
                this.popOutSelectElements( select );
            }

            if ( target.length > 0 && !this.selectDataOverride )
            {
                this.refs.select    = select;
                const data          = [];
                const selectOptions = [];

                nativeSlice.call( target.children, 0 ).forEach( optionEl =>
                {
                    selectOptions.push( optionEl );
                    data.push( {
                        text    : optionEl.innerHTML,
                        value   : optionEl.value
                    } );
                } );

                refs.selectOptions = selectOptions;

                this.data               = data;
            }
            else if ( this.selectDataOverride )
            {
                utils.removeAllChildren( target );
            }

            this.target             = target.parentNode;
            utils.addClass( target, classes.HIDDEN );
        }
        else
        {
            select = utils.constructElement( {
                tagname     : 'SELECT',
                className   : `${classes.SELECT_TAG}  ${classes.HIDDEN}`
            } );

            wrapper.appendChild( select );
        }

        return select;
    },


    /**
     * ## popInSelectElements
     *
     * pops the previously saves elements back into a select tag, restoring the
     * original state
     *
     * @param {DOMElement} select select element
     *
     * @return {Void} void
     */
    popInSelectElements( select )
    {
        utils.removeAllChildren( select );

        this.originalChildren.forEach( _el =>
        {
            select.appendChild( _el );
        } );
    },


    /**
     * ## popOutSelectElements
     *
     * pops out all the options of a select box, clones them, then appends the
     * clones.  This gives us the ability to restore the original tag
     *
     * @param {DOMElement} select select element
     *
     * @return {Void} void
     */
    popOutSelectElements( select )
    {
        const res = [];

        this.originalChildren = nativeSlice.call( select.children, 0 );
        const children = this.originalChildren;

        children.forEach( ( _el, i ) =>
        {
            res[ i ] = _el.cloneNode( true );
            select.removeChild( _el );
        } );

        res.forEach( _el =>
        {
            select.appendChild( _el );
        } );
    },


    /**
     * ## reconfigure
     *
     * after editing the data, this can be used to rebuild them
     *
     * @param {Array} data flounder data options
     * @param {Object} props object containing config options
     *
     * @return {Object} rebuilt flounder object
     */
    reconfigure( data, props )
    {
        if ( data && typeof data !== 'string' &&
                                            typeof data.length === 'number' )
        {
            props       = props       = props || this.props;
            props.data  = data;
        }
        else if ( !props && typeof data === 'object' )
        {
            props       = data;
            props.data  = props.data || this.data;
        }
        else
        {
            props       = props         || {};
            props.data  = props.data    || this.data;
        }

        return this.constructor( this.originalTarget, props );
    },


    /**
     * ## setTarget
     *
     * sets the target related
     *
     * @param {DOMElement} target  the actual to-be-flounderized element
     *
     * @return {Void} void
     */
    setTarget( target )
    {
        target      = target.nodeType === 1 ? target :
                                            document.querySelector( target );

        this.originalTarget = target;
        target.flounder     = this;

        if ( target.tagName === 'INPUT' )
        {
            const classes = this.classes;
            utils.addClass( target, classes.HIDDEN );
            target.setAttribute( 'aria-hidden', true );
            target.tabIndex = -1;
            target          = target.parentNode;
        }

        this.target = target;
    }
};

export default build;
