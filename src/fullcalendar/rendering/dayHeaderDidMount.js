/**
 * @copyright Copyright (c) 2020 Georg Ehrke
 * @author Georg Ehrke <oc.list@georgehrke.com>
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
 */

/**
 * Adjusts the colSpan attribute of day-headers in the list view
 *
 * @param {object} data The destructuring object
 * @param data.el
 * @param {Node} el The HTML element
 */
export default function({ el }) {
	if (el.classList.contains('fc-list-day')) {
		el.firstChild.colSpan = 5
	}
}
