import React from 'react'
import AttendanceTable from './AttendanceTable'

const EmployeeData = ({ data }) => {
	return (
		<div className="border-2 rounded-md m-5">
			<details className="collapse bg-base-100">
				<summary className="collapse-title text-xl font-medium">
					<h2 className="px-5">Mã nhân viên: {data.employeeId}</h2>
					<h2 className="px-5">Tên: {data.name}</h2>
					<h2 className="px-5">Bộ phận: {data.department}</h2>
				</summary>
				<div class="collapse-content">
					<AttendanceTable data={data.attendance} />
				</div>
			</details>
		</div>
	)
}

export default EmployeeData
