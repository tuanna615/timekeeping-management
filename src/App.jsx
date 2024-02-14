import * as XLSX from 'xlsx'
import _ from 'lodash'
import { useState } from 'react'
import moment from 'moment'

const DAY_OF_WEEK = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const PATTERN =
	/Mã nhân viên: (\w+)\s+Tên nhân viên: ([\w\s]+)\s+Bộ phận: ([\w\s]+)/
const ARRIVAL_TIME = moment('08:00:00', 'hh:mm:ss')
const LEAVE_TIME = moment('17:00:00', 'hh:mm:ss')
const BREAK_TIME = moment('12:00:00', 'hh:mm:ss')
const BACK_TIME = moment('13:00:00', 'hh:mm:ss')

function ExcelReader() {
	const [data, setData] = useState([])

	const combineDateAndTime = (date, time) => {
		return moment(date)
			.hour(time.hour())
			.minute(time.minute())
			.second(time.second())
	}

	const processAtendance = (data) => {
		const dateObject = XLSX.SSF.parse_date_code(data[0])
		const date = moment()
			.date(dateObject.d)
			.month(dateObject.m - 1)
			.year(dateObject.y)
			.startOf('day')
		const checkIns = _.map(_.sortBy(_.drop(data, 2)), (checkIn) => {
			const timeObject = XLSX.SSF.parse_date_code(checkIn)
			return moment()
				.date(dateObject.d)
				.month(dateObject.m - 1)
				.year(dateObject.y)
				.hour(timeObject.H)
				.minute(timeObject.M)
				.second(timeObject.S)
		})
		const attendance = {
			date,
			checkIns,
		}
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
						department: _.trim(match[3]),
						attendance: [],
					})
				}
				if (_.intersection(DAY_OF_WEEK, row).length) {
					const employee = employees[employees.length - 1]
					const attendance = processAtendance(row)
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
			<input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} />
			{/* Display data from state */}
			<pre>{JSON.stringify(data, null, 2)}</pre>
		</div>
	)
}

export default ExcelReader
