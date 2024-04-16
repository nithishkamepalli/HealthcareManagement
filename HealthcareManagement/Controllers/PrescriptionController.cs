using Dapper;
using HealthcareManagement.Models;
using Microsoft.AspNetCore.Mvc;
using Npgsql;

using Model = HealthcareManagement.Models.PrescriptionModel;

namespace HealthcareManagement.Controllers;

[ApiController]
[Route("[controller]")]
public class PrescriptionController : ControllerBase
{
    private readonly NpgsqlConnection connection;

    public PrescriptionController(IConfiguration _configuration)
    {
        string connectionString = _configuration.GetConnectionString("DefaultConnection") ?? string.Empty;
        this.connection = new NpgsqlConnection(connectionString);
    }

    ~PrescriptionController()
    {
        if(this.connection != null)
        {
            this.connection.Close();
        }
    }

    [HttpPost("filter")]
    public async Task<IActionResult> GetAll([FromBody] PrescriptionFilterModel model)
    {
        var where = @$"WHERE a.""AppointmentId"" = {model.AppointmentId}";

        if(!string.IsNullOrEmpty(model.MedicationName))
        {
            where += $@" AND p.""MedicationName"" like '%{model.MedicationName}%' ";
        }

        var query = @$"SELECT p.* FROM ""Prescription"" p 
                        JOIN ""Appointment"" a on a.""AppointmentId"" = p.""AppointmentId"" {where} ";
                        
        var records = await connection.QueryAsync<Model>(query);
        return Ok(records);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        return await this.GetByIdHelper(id);
    }

    private async Task<IActionResult> GetByIdHelper(int id)
    {
        var query = @$"SELECT * FROM ""Prescription"" WHERE ""PrescriptionId"" = {id}";
        var record = await connection.QuerySingleAsync<Model>(query);
        return Ok(record);
    }

    [HttpPost("create")]
    public async Task<IActionResult> Create([FromBody] Model model)
    {
        var query = $@"INSERT INTO ""Prescription"" (""AppointmentId"", ""MedicationName"", ""Dosage"", ""Instructions"")
                        VALUES ({model.AppointmentId}, '{model.MedicationName}', '{model.Dosage}', '{model.Instructions}')
                        RETURNING ""PrescriptionId""";
        var newId = await this.connection.ExecuteScalarAsync(query);
        return await this.GetByIdHelper((int)newId);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Model model)
    {
        var query = $@"UPDATE ""Prescription"" SET ""MedicationName"" = '{model.MedicationName}', ""Dosage"" = '{model.Dosage}',
                        ""Instructions"" = '{model.Instructions}' WHERE ""PrescriptionId"" = {id} ";
        var updatedCount = await this.connection.ExecuteAsync(query);
        return Ok(updatedCount);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var query = $@"DELETE FROM ""Prescription"" WHERE ""PrescriptionId"" = {id} ";
        var deletedCount = await this.connection.ExecuteAsync(query);
        return Ok(deletedCount);
    }
}

