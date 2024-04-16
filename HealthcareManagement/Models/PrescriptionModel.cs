namespace HealthcareManagement.Models
{
	public class PrescriptionModel
	{
        public int? PrescriptionId { get; set; }
        public int AppointmentId { get; set; }
        public string MedicationName { get; set; }
        public string Dosage { get; set; }
        public string Instructions { get; set; }
    }
}

