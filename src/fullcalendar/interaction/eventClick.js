/**
 * @copyright Copyright (c) 2019 Georg Ehrke
 *
 * @author Georg Ehrke <oc.list@georgehrke.com>
 *
 * @license GNU AGPL version 3 or any later version
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 */
import { getPrefixedRoute } from '../../utils/router'
import { hardForkTask } from '../../utils/tasks'
import { mapCalendarJsToCalendarObject } from '../../models/calendarObject'
import { mapEventComponentToEventObject } from '../../models/event.js'

/**
 * Returns a function for click action on event. This will open the editor.
 * Either the popover or the sidebar, based on the user's preference.
 *
 * @param {Object} store The Vuex store
 * @param {Object} router The Vue router
 * @param {Object} route The current Vue route
 * @param {Window} window The window object
 * @returns {Function}
 */
export default function(store, router, route, window) {
	return function({ event, jsEvent }) {
		switch (event.extendedProps.objectType) {
		case 'VEVENT':
			handleEventClick(event, store, router, route, window)
			break

		case 'VTODO':
			isCheckboxClick(jsEvent) ? toggleCompleted(event, store) : handleEventClick(event, store, router, route, window)
			break
		}
	}
}

/**
 * Handle eventClick for VEVENT
 *
 * @param {EventDef} event FullCalendar event
 * @param {Object} store The Vuex store
 * @param {Object} router The Vue router
 * @param {Object} route The current Vue route
 * @param {Window} window The window object
 */
function handleEventClick(event, store, router, route, window) {
	let desiredRoute = store.state.settings.skipPopover
		? 'EditSidebarView'
		: 'EditPopoverView'

	if (window.innerWidth <= 768 && desiredRoute === 'EditPopoverView') {
		desiredRoute = 'EditSidebarView'
	}

	const name = getPrefixedRoute(route.name, desiredRoute)
	const params = Object.assign({}, route.params, {
		object: event.extendedProps.objectId,
		recurrenceId: String(event.extendedProps.recurrenceId),
	})

	// Don't push new route when day didn't change
	if ((getPrefixedRoute(route.name, 'EditPopoverView') === route.name || getPrefixedRoute(route.name, 'EditSidebarView') === route.name)
		&& params.object === route.params.object
		&& params.recurrenceId === route.params.recurrenceId) {
		return
	}

	router.push({ name, params })
}

export function isCheckboxClick(jsEvent) {
	return isElementClick(jsEvent, 'fc-event-title-checkbox')
}

export function isElementClick(jsEvent, className) {
	if (!jsEvent || !className) {
		return false
	}

	const path = jsEvent.path || (jsEvent.composedPath && jsEvent.composedPath())
	if (!path) {
		return false
	}
	return path[0].classList.contains(className)
}

export async function toggleCompleted(event, store) {
	const { calendarObject, calendarObjectInstance } = await store.dispatch(
		'getCalendarObjectInstanceByObjectIdAndRecurrenceId',
		event.extendedProps
	)

	if (!calendarObject.isTodo) { return }
	let eventComponent = calendarObjectInstance.eventComponent

	if (eventComponent.isRecurring()) {

		// Change recurrence start to next occurrence
		const next = eventComponent.nextOccurrence()
		if (next) {
			eventComponent.masterItem.startDate = next
			eventComponent.masterItem.endDate = next
			store.dispatch('updateCalendarObject', { calendarObject })
		} else {
			store.dispatch('deleteCalendarObject', { calendarObject })
		}

		// Add separate completed task
		const calendarComponent = hardForkTask(eventComponent)
		eventComponent = calendarComponent.getVObjectIterator().next().value

		store.commit('setCalendarObjectInstanceForNewEvent', {
			calendarObject: mapCalendarJsToCalendarObject(calendarComponent, calendarObject.calendarId),
			calendarObjectInstance: mapEventComponentToEventObject(eventComponent),
		})
	}

	eventComponent.percent === 100 ? eventComponent.uncheck() : eventComponent.check()

	await store.dispatch('saveCalendarObjectInstance', {
		thisAndAllFuture: false,
		calendarId: event.extendedProps.calendarId,
	})
	store.commit('resetCalendarObjectInstanceObjectIdAndRecurrenceId')
}
