import React from 'react'

const EmployeeData = ({ data }) => {
	return (
		<div>
			<h2>Mã nhân viên: {data.employeeId}</h2>
			<h2>Tên: {data.name}</h2>
			<h2>Bộ phận: {data.department}</h2>
<table style={{ border: '1px solid black' }}>
    <thead>
        <tr>
            <th style={{ border: '1px solid black' }}>Ngày</th>
            <th style={{ border: '1px solid black' }}>Ngày trong tuần</th>
            <th style={{ border: '1px solid black' }}>Danh sách chấm công</th>
            <th style={{ border: '1px solid black' }}>Thời gian đến</th>
            <th style={{ border: '1px solid black' }}>Thời gian nghỉ</th>
            <th style={{ border: '1px solid black' }}>Thời gian quay lại</th>
            <th style={{ border: '1px solid black' }}>Thời gian về</th>
            <th style={{ border: '1px solid black' }}>Đến muộn</th>
            <th style={{ border: '1px solid black' }}>Nghỉ sớm</th>
            <th style={{ border: '1px solid black' }}>Quay lại muộn</th>
            <th style={{ border: '1px solid black' }}>Về sớm</th>
            <th style={{ border: '1px solid black' }}>Tổng thời gian sớm</th>
            <th style={{ border: '1px solid black' }}>Tổng thời gian muộn</th>
            <th style={{ border: '1px solid black' }}>Ghi chú</th>
        </tr>
    </thead>
    <tbody>
        {data.attendance.map((record, index) => (
            <tr key={index}>
                <td style={{ border: '1px solid black', padding: '5px' }}>{record.date}</td>
                <td style={{ border: '1px solid black', padding: '5px' }}>{record.dayOfWeek}</td>
                <td style={{ border: '1px solid black', padding: '5px' }}>
                    {record.checkIns.map((checkIn, index) => (
                        <td key={index} style={{ border: '1px solid black', padding: '5px' }}>{checkIn}</td>
                    ))}
                </td>
                <td style={{ border: '1px solid black', padding: '5px' }}>{record.arrivalTime}</td>
                <td style={{ border: '1px solid black', padding: '5px' }}>{record.breakTime}</td>
                <td style={{ border: '1px solid black', padding: '5px' }}>{record.backTime}</td>
                <td style={{ border: '1px solid black', padding: '5px' }}>{record.leaveTime}</td>
                <td style={{ border: '1px solid black', padding: '5px' }}>{record.lateArrivalMinutes}</td>
                <td style={{ border: '1px solid black', padding: '5px' }}>{record.earlyBreakMinutes}</td>
                <td style={{ border: '1px solid black', padding: '5px' }}>{record.lateBackMinutes}</td>
                <td style={{ border: '1px solid black', padding: '5px' }}>{record.earlyLeaveMinutes}</td>
                <td style={{ border: '1px solid black', padding: '5px' }}>{record.totalEarlyMinute}</td>
                <td style={{ border: '1px solid black', padding: '5px' }}>{record.totalLateMinute}</td>
                <td style={{ border: '1px solid black', padding: '5px' }}>{/* {JSON.stringify(record)} */}</td>
            </tr>
        ))}
    </tbody>
</table>
		</div>
	)
}

export default EmployeeData
