// Date filter component
// TODO: Implement date picker with Today button

const DateFilter = ({ selectedDate, onDateChange }) => {
  return (
    <div>
      <label>Select Date:</label>
      <input type="date" value={selectedDate} onChange={(e) => onDateChange(e.target.value)} />
    </div>
  );
};

export default DateFilter;
