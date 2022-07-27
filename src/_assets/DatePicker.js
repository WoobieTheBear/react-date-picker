import React, { useState, useEffect, useCallback, useRef } from 'react';
import './DatePicker.css';

export const DatePicker = ({
    setValue,
}) => {
    const oneDay = 60 * 60 * 24 * 1000;
    const timeZoneOffsetInMinutes = -( new Date().getTimezoneOffset() );
    const todayTimestamp = Date.now() - (Date.now() % oneDay);

    const inputRef = useRef( null )
    const wrapperRef = useRef( null )
    
    const [ init, setInit ] = useState( false )
    const [ pickerVisible, setPickerVisible ] = useState( false )
    const [ selectedDay, setSelectedDay ] = useState( new Date() )
    const [ year, setYear ] = useState( selectedDay.getFullYear() )
    const [ month, setMonth ] = useState( selectedDay.getMonth() )
    const [ monthDetails, setMonthDetails ] = useState( [] )

    // const daysMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthMap = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const getMonthStr = month => monthMap[ Math.max( Math.min( 11, month ), 0 ) ] || 'Month';

    const pixelToRem = (pixel) => {
        return pixel / parseFloat(getComputedStyle(document.documentElement).fontSize);
    }

    const equalDate = ( leftHand, rightHand ) => {
        return leftHand.getFullYear() === rightHand.getFullYear()
            && leftHand.getMonth() === rightHand.getMonth()
            && leftHand.getDate() === rightHand.getDate()
    }

    const getMonthDetails = useCallback(( year, month ) => {
        // this months data
        const firstDay = ( new Date( year, month ) ).getDay();
        const numberOfDays = 40 - new Date( year, month, 40 ).getDate();
        const numberOfFields = ( Math.ceil( (firstDay + numberOfDays) / 7 ) * 7 )

        // next months data
        const { _year : prevYear, _month: prevMonth } = countMonthDown( year, month )
        const numberOfDaysPrevMonth = 40 - new Date( prevYear, prevMonth, 40 ).getDate();

        const monthArray = [ ...Array( numberOfFields ).keys() ].map( index => {
            const delta = index - firstDay;
            let dayOfMonth = 0;
            let appearance = 'invalid';
            let dateObject = null;

            if( delta < 0 ){
                // day is from previous month
                dayOfMonth = (numberOfDaysPrevMonth + delta) + 1;
                const { _year, _month } = countMonthDown( year, month )
                dateObject = new Date( _year, _month, dayOfMonth )
                dateObject.setMinutes( timeZoneOffsetInMinutes )
            } else if ( delta >= numberOfDays ) {
                // day is from next month
                dayOfMonth = (delta - numberOfDays) + 1;
                const { _year, _month } = countMonthUp( year, month )
                dateObject = new Date( _year, _month, dayOfMonth )
                dateObject.setMinutes( timeZoneOffsetInMinutes )
            } else {
                // day is from this month
                dayOfMonth = delta + 1;
                dateObject = new Date( year, month, dayOfMonth )
                dateObject.setMinutes( timeZoneOffsetInMinutes )

                appearance = ( selectedDay && equalDate( selectedDay, dateObject) )
                    ? 'selected' 
                    : (dateObject.valueOf() === todayTimestamp)
                    ? 'current' 
                    : 'valid';
            }
            // NOTE: these dateObjects have timezone offset
            return {
                appearance,
                dateObject,
            }
        })

        return monthArray;
    }, [todayTimestamp, selectedDay])

    const updateDetails = useCallback(() => {
        const details = getMonthDetails( year, month )
        setMonthDetails( details )
    }, [ getMonthDetails, setMonthDetails, month, year ])

    useEffect( ()=>{
        if( !init ){
            updateDetails()
            return () => { setInit(true) }
        }
    }, [init, updateDetails] )

    const countMonthUp = ( year, month ) => {
        let _year = year;
        let _month = month + 1;
        if( _month > 11 ) {
            _month = 0;
            _year++;
        }
        return { _year, _month };
    }

    const countMonthDown = ( year, month ) => {
        let _year = year;
        let _month = month - 1;
        if( _month < 0 ) {
            _month = 11;
            _year--;
        }
        return { _year, _month };
    }

    const selectDay = (evt, { dateObject }) => {
        evt.preventDefault()
        inputRef.current.valueAsDate = dateObject;
        setSelectedDay( dateObject );
        setPickerVisible( false )
        setInit( false )
        if( setValue ) {
            setValue( dateObject.valueOf() )
        }
    }

    const selectYear = (year, month, offset) => {
        let updatedYear = year + offset;
        setYear( updatedYear );
        setMonthDetails( getMonthDetails( updatedYear, month ) );
    }

    const selectMonth = (year, month, offset) => {
        const { _year, _month } = ( offset > 0 ) 
            ? countMonthUp( year, month )
            : countMonthDown( year, month );

        setYear( _year )
        setMonth( _month )
        setMonthDetails( getMonthDetails( _year, _month ) )
    }

    const showDatePicker = ( evt ) => {
        // console.log( evt )
        evt.preventDefault()
        const { clientX: posX } = evt;
        const { left } = evt.target.getBoundingClientRect();
        const x = pixelToRem( posX - left );
        if( x < 9.3 ){
            setPickerVisible( !pickerVisible )
        }
    }

    const inputOnKey = ( evt ) => {
        if( evt.code === "Enter" ){
            evt.preventDefault()
            let dateValue = new Date( inputRef.current.valueAsDate )

            if( dateValue.valueOf() > 0 ){
                setSelectedDay( dateValue )
                setYear( dateValue.getFullYear() )
                setMonth( dateValue.getMonth() )
    
                setPickerVisible( false )
                setInit( false )
    
                if( setValue ){
                    setValue( dateValue.valueOf() )
                }
            } else {
                setValue( -1 )
            }
        }
        if( evt.code === "Escape" ){
            setPickerVisible( false )
        }
    }

    const Calendar = () => {
        const dayButtons = monthDetails.map( (entry, index) => {
            return (
                <button 
                    key={ index }
                    data-appearance={ entry.appearance }
                    disabled={ ( entry.appearance === 'invalid' ) }
                    onMouseDown={ ( evt ) => selectDay( evt, entry ) }
                >{ entry.dateObject.getDate() }</button>
            )
        } )

        return (
            <div data-calendar >
                { ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map( (day, index) => <span key={index} >{day}</span> ) }
                { dayButtons }
            </div>
        )
    }

    return (
        <div ref={ wrapperRef } className='DatePicker'>
            <div data-datewrapper>
                <input 
                    // type='date'
                    type='datetime-local'
                    ref={ inputRef } 
                    onClick={ showDatePicker }
                    onKeyDown={ inputOnKey }
                />
                {   pickerVisible &&
                    <div>
                        <span>{/* triangle */}</span>
                        <div>
                            <button data-doubleback onClick={ ()=> selectYear( year, month, -1 ) }></button>
                            <button data-back onClick={ ()=> selectMonth( year, month, -1 ) }></button>
                            <div data-yearandmonth>
                                <span>{ year }</span>
                                <span>{ getMonthStr( month ) }</span>
                            </div>
                            <button data-forward onClick={ ()=> selectMonth( year, month, 1 ) }></button>
                            <button data-doubleforward onClick={ ()=> selectYear( year, month, 1 ) }></button>
                            <Calendar />
                        </div>
                    </div>
                }
            </div>
        </div>
    )
}