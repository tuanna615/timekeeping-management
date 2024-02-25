import * as XLSX from 'xlsx'
import _ from 'lodash'
import { useState } from 'react'
import moment from 'moment'
import EmployeeData from './EmployeeData'

const DAY_OF_WEEK = [
	'CN',
	'T2',
	'T3',
	'T4',
	'T5',
	'T6',
	'T7',
	'T.2',
	'T.3',
	'T.4',
	'T.5',
	'T.6',
	'T.7',
	'Ba',
	'Tư',
	'Năm',
	'Sáu',
	'Bảy',
]
const PATTERN =
	/Mã nhân viên: ([\w\s]+)\s+Tên nhân viên: ([\w\s]+)\s+(Bộ phận|Phòng ban): ([\w\s]+)/

const NON_CHECKIN_DATA_FIRST_COLUMN = 2

const TIME_FORMAT = 'HH:mm'
const DATE_FORMAT = 'DD-MM-YYYY'

const ARRIVAL_TIME = moment('08:00:00', TIME_FORMAT).valueOf()
const LEAVE_TIME = moment('17:00:00', TIME_FORMAT).valueOf()
const BREAK_TIME = moment('12:00:00', TIME_FORMAT).valueOf()
const BACK_TIME = moment('13:00:00', TIME_FORMAT).valueOf()

function ExcelReader() {
	const [data, setData] = useState([])

	const combineDateAndTime = ({ date, time }) => {
		return moment(date)
			.hour(moment(time).hour())
			.minute(moment(time).minute())
			.second(moment(time).second())
	}

	const getClosetCheckIns = ({
		checkIns,
		time,
		diffThreshold,
		position,
		type,
	}) => {
		const closestCheckIns = _.filter(
			_.map(_.sortBy(checkIns), (checkIn) => {
				return {
					checkIn,
					diff: Math.abs(moment(checkIn).diff(moment(time), 'minutes')),
				}
			}),
			(checkIn) => {
				return checkIn.diff <= diffThreshold
			}
		)
		if (closestCheckIns.length === 1) {
			return closestCheckIns[0].checkIn
		}
		const closestCheckIn = _[position](
			_.filter(closestCheckIns, (checkIn) => {
				return moment(checkIn.checkIn)[type](moment(time))
			})
		)
		if (!closestCheckIn) {
			return null
		}
		return closestCheckIn.checkIn
	}

	const getDateCheckIns = (data, date) => {
		return _.compact(
			_.map(
				_.sortBy(_.drop(data, NON_CHECKIN_DATA_FIRST_COLUMN)),
				(checkIn) => {
					if (!checkIn) {
						return null
					}
					const timeObject = XLSX.SSF.parse_date_code(checkIn)
					let time = null
					if (_.isNaN(timeObject.H)) {
						time = moment(checkIn, TIME_FORMAT)
						if (!time.isValid()) {
							return null
						}
					} else {
						time = moment()
							.hour(timeObject.H)
							.minute(timeObject.M)
							.second(timeObject.S)
					}
					return combineDateAndTime({
						date,
						time,
					})
				}
			)
		)
	}

	const calculateAtendance = (data) => {
		let attendance = {}
		const dateObject = XLSX.SSF.parse_date_code(data[0])
		const date = moment()
			.date(dateObject.d)
			.month(dateObject.m - 1)
			.year(dateObject.y)
			.startOf('day')
		attendance.date = date
		attendance.dayOfWeek = data[1]
		const checkIns = getDateCheckIns(data, date)
		attendance.checkIns = [...checkIns]
		if (checkIns.length === 0) {
			attendance.dayOff = true
			return attendance
		}
		const arrivalTime = moment(checkIns.shift())
		attendance.arrivalTime = arrivalTime
		const arrivalDateTime = combineDateAndTime({ date, time: ARRIVAL_TIME })
		attendance.arrivalDateTime = arrivalDateTime
		attendance.isLateArrival = moment(arrivalTime).isAfter(
			moment(arrivalDateTime)
		)
		if (checkIns.length === 0) {
			attendance.missingCheckIn = true
			return attendance
		}
		const leaveTime = moment(checkIns.pop())
		attendance.leaveTime = leaveTime
		const leaveDateTime = combineDateAndTime({ date, time: LEAVE_TIME })
		attendance.leaveDateTime = leaveDateTime
		attendance.isEarlyLeave = moment(leaveTime).isBefore(moment(leaveDateTime))
		if (checkIns.length < 2) {
			attendance.missingBreak = true
			return attendance
		}
		const breakDateTime = combineDateAndTime({ date, time: BREAK_TIME })
		attendance.breakDateTime = breakDateTime
		const backDateTime = combineDateAndTime({ date, time: BACK_TIME })
		attendance.backDateTime = backDateTime
		const breakTimeCheckIns = _.filter(checkIns, (checkIn) => {
			return moment(checkIn).isBetween(
				moment(breakDateTime),
				moment(backDateTime),
				undefined,
				'[]'
			)
		})
		if (breakTimeCheckIns.length === 0) {
			attendance.invalidBreak = true
			return attendance
		}
		if (breakTimeCheckIns.length < 2) {
			attendance.invalidBreak = true
			attendance.inTimeBreak = moment(_.head(breakTimeCheckIns))
			return attendance
		}
		const breakTime = moment(breakTimeCheckIns.shift())
		attendance.breakTime = moment(breakTime)
		const backTime = moment(breakTimeCheckIns.pop())
		attendance.backTime = moment(backTime)
		return attendance
	}

	const processInvalidBreak = (data) => {
		const attendance = { ...data }
		if (!attendance.invalidBreak) {
			return attendance
		}
		const { date } = attendance
		const checkIns = _.map(attendance.checkIns, (checkIn) => {
			return moment(checkIn)
		})
		const breakDateTime = combineDateAndTime({ date, time: BREAK_TIME })
		const backDateTime = combineDateAndTime({ date, time: BACK_TIME })
		const x = _.slice(checkIns, 1, checkIns.length - 1)
		const outsideBreakTimeCheckIns = _.filter(x, (checkIn) => {
			return (
				moment(checkIn).isBefore(moment(breakDateTime)) ||
				moment(checkIn).isAfter(moment(backDateTime))
			)
		})
		const diffWithBreak = _.map(outsideBreakTimeCheckIns, (checkIn) => {
			return {
				checkIn,
				diff: Math.abs(
					moment(checkIn).diff(moment(breakDateTime), 'milliseconds')
				),
			}
		})
		const diffWithBack = _.map(outsideBreakTimeCheckIns, (checkIn) => {
			return {
				checkIn,
				diff: Math.abs(
					moment(checkIn).diff(moment(backDateTime), 'milliseconds')
				),
			}
		})
		if (attendance.inTimeBreak) {
			const minDiffWithBreak = _.minBy(
				_.concat(diffWithBreak, diffWithBack),
				'diff'
			)
			if (
				moment(minDiffWithBreak.checkIn).isBefore(
					moment(attendance.inTimeBreak)
				)
			) {
				attendance.isEarlyBreak = true
			} else {
				attendance.isLateBack = true
			}
			const breakCheckIns = _.sortBy(
				[attendance.inTimeBreak, minDiffWithBreak.checkIn],
				(checkIn) => {
					return moment(checkIn).valueOf()
				}
			)
			attendance.breakTime = moment(breakCheckIns[0])
			attendance.backTime = moment(breakCheckIns[1])
			return attendance
		}
		const closestBreak = _.minBy(diffWithBreak, 'diff')
		attendance.breakTime = moment(closestBreak.checkIn)
		const closestBack = _.minBy(diffWithBack, 'diff')
		attendance.backTime = moment(closestBack.checkIn)
		attendance.isEarlyBreak = true
		attendance.isLateBack = true
		return attendance
	}

	const formatDateTimeFields = (data) => {
		const attendance = { ...data }
		attendance.date = moment(attendance.date).format(DATE_FORMAT)
		attendance.checkIns = _.map(attendance.checkIns, (checkIn) => {
			return moment(checkIn).format(TIME_FORMAT)
		})
		if (attendance.dayOff) {
			return attendance
		}
		if (attendance.arrivalTime) {
			attendance.arrivalTime = moment(attendance.arrivalTime).format(
				TIME_FORMAT
			)
		}
		if (attendance.leaveTime) {
			attendance.leaveTime = moment(attendance.leaveTime).format(TIME_FORMAT)
		}
		if (attendance.breakTime) {
			attendance.breakTime = moment(attendance.breakTime).format(TIME_FORMAT)
		}
		if (attendance.backTime) {
			attendance.backTime = moment(attendance.backTime).format(TIME_FORMAT)
		}
		if (attendance.inTimeBreak) {
			attendance.inTimeBreak = moment(attendance.inTimeBreak).format(
				TIME_FORMAT
			)
		}
		return attendance
	}

	const calculateLateEarly = (data) => {
		const attendance = { ...data }
		if (attendance.dayOff || attendance.missingCheckIn) {
			return attendance
		}
		attendance.lateArrivalMinutes = 0
		attendance.earlyLeaveMinutes = 0
		attendance.earlyBreakMinutes = 0
		attendance.lateBackMinutes = 0
		if (
			!attendance.isLateArrival &&
			!attendance.isEarlyLeave &&
			!attendance.isEarlyBreak &&
			!attendance.isLateBack
		) {
			return attendance
		}
		if (attendance.isLateArrival) {
			attendance.lateArrivalMinutes += moment(attendance.arrivalTime).diff(
				moment(attendance.arrivalDateTime),
				'minutes'
			)
		}
		if (attendance.isEarlyLeave) {
			attendance.earlyLeaveMinutes += moment(attendance.leaveDateTime).diff(
				moment(attendance.leaveTime),
				'minutes'
			)
		}
		if (attendance.isEarlyBreak) {
			attendance.earlyBreakMinutes += moment(attendance.breakDateTime).diff(
				moment(attendance.breakTime),
				'minutes'
			)
		}
		if (attendance.isLateBack) {
			attendance.lateBackMinutes += moment(attendance.backTime).diff(
				moment(attendance.backDateTime),
				'minutes'
			)
		}
		attendance.totalEarlyMinute =
			attendance.earlyLeaveMinutes + attendance.earlyBreakMinutes
		attendance.totalLateMinute =
			attendance.lateArrivalMinutes + attendance.lateBackMinutes
		return attendance
	}

	const calculateNote = (data) => {
		const attendance = { ...data }
		const notes = []
		if (attendance.dayOff) {
			notes.push('Ngày nghỉ')
		}
		if (attendance.missingCheckIn) {
			notes.push('Thiếu chấm công')
		}
		if (attendance.missingBreak) {
			notes.push('Thiếu giờ nghỉ trưa')
		}
		if (attendance.invalidBreak) {
			notes.push('Sai giờ nghỉ trưa')
		}
		if (attendance.isLateArrival) {
			notes.push('Đến muộn')
		}
		if (attendance.isEarlyLeave) {
			notes.push('Về sớm')
		}
		if (attendance.isEarlyBreak) {
			notes.push('Nghỉ trưa sớm')
		}
		if (attendance.isLateBack) {
			notes.push('Quay lại muộn')
		}
		attendance.notes = _.join(notes, ', ')
		return attendance
	}

	const handleFileUpload = (e) => {
		const file = e.target.files[0]
		const reader = new FileReader()
		reader.onload = (evt) => {
			const bstr = evt.target.result
			const wb = XLSX.read(bstr, { type: 'binary' })
			const wsname = wb.SheetNames[0]
			const ws = wb.Sheets[wsname]
			// Get the data array using XLSX.utils.sheet_to_json
			const data = XLSX.utils.sheet_to_json(ws, { header: 1 })
			// Iterate over the data array
			console.log(data)
			const employees = []
			_.forEach(data, (row) => {
				if (_.includes(row[0], 'Mã nhân viên')) {
					const match = PATTERN.exec(row[0])
					employees.push({
						employeeId: _.trim(match[1]),
						name: _.trim(match[2]),
						department: _.trim(match[4]),
						attendance: [],
					})
				}
				if (_.intersection(DAY_OF_WEEK, row).length) {
					const employee = employees[employees.length - 1]
					let attendance = calculateAtendance(row)
					if (attendance.invalidBreak) {
						attendance = processInvalidBreak(attendance)
					}
					attendance = calculateLateEarly(attendance)
					attendance = formatDateTimeFields(attendance)
					attendance = calculateNote(attendance)
					employee.attendance.push(attendance)
				}
			})
			setData(employees)
			console.log(employees)
		}
		reader.readAsBinaryString(file)
	}

	return (
		<div>
			<div className="join p-2">
				<input
					type="file"
					accept=".xlsx,.xls"
					onChange={handleFileUpload}
					className="file-input"
				/>
			</div>
			{/* Display data from state */}
			{data.map((employee, index) => (
				<EmployeeData key={index} data={employee} />
			))}
		</div>
	)
}

export default ExcelReader
