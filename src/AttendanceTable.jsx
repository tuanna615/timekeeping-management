import React from 'react'

const AttendanceTable = ({ data }) => {
	return (
		<div className="overflow-x-auto">
			<table className="table border-2 rounded-md">
				<thead>
					<tr>
						<th className="border-2">Ngày</th>
						<th className="border-2">Ngày trong tuần</th>
						<th className="border-2">Danh sách chấm công</th>
						<th className="border-2">Thời gian đến</th>
						<th className="border-2">Thời gian nghỉ</th>
						<th className="border-2">Thời gian quay lại</th>
						<th className="border-2">Thời gian về</th>
						<th className="border-2">Đến muộn</th>
						<th className="border-2">Nghỉ sớm</th>
						<th className="border-2">Quay lại muộn</th>
						<th className="border-2">Về sớm</th>
						<th className="border-2">Tổng thời gian sớm</th>
						<th className="border-2">Tổng thời gian muộn</th>
						<th className="border-2">Ghi chú</th>
					</tr>
				</thead>
				<tbody>
					{data.map((record, index) => (
						<tr key={index} className="hover">
							<td className="border-2">{record.date}</td>
							<td className="border-2">{record.dayOfWeek}</td>
							<td className="border-2">
								{record.checkIns.map((checkIn, index) => (
									<td key={index} className="border-2">
										{checkIn}
									</td>
								))}
							</td>
							<td className="border-2">{record.arrivalTime}</td>
							<td className="border-2">{record.breakTime}</td>
							<td className="border-2">{record.backTime}</td>
							<td className="border-2">{record.leaveTime}</td>
							<td className="border-2">{record.lateArrivalMinutes}</td>
							<td className="border-2">{record.earlyBreakMinutes}</td>
							<td className="border-2">{record.lateBackMinutes}</td>
							<td className="border-2">{record.earlyLeaveMinutes}</td>
							<td className="border-2">{record.totalEarlyMinute}</td>
							<td className="border-2">{record.totalLateMinute}</td>
							<td className="border-2">{record.notes}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}

export default AttendanceTable
