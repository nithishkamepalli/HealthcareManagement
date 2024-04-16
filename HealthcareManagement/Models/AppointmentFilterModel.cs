namespace HealthcareManagement.Models
{
	public class AppointmentFilterModel
	{
        public string? PatientName { get; set; }
        public string? DoctorName { get; set; }
        public DateTime? AppointmentDate { get; set; }
        public int? AppointmentId { get; set; }
    }
}

