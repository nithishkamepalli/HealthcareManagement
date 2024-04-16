using Dapper;
using Microsoft.AspNetCore.Mvc;
using Npgsql;

using Model = HealthcareManagement.Models.PatientModel;

namespace HealthcareManagement.Controllers;

[ApiController]
[Route("[controller]")]
public class PatientController : ControllerBase
{
    private readonly NpgsqlConnection connection;

    public PatientController(IConfiguration _configuration)
    {
        string connectionString = _configuration.GetConnectionString("DefaultConnection") ?? string.Empty;
        this.connection = new NpgsqlConnection(connectionString);
    }

    ~PatientController()
    {
        if(this.connection != null)
        {
            this.connection.Close();
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var query = @"SELECT * FROM ""Patient"" ";
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
        var query = @$"SELECT * FROM ""Patient"" WHERE ""PatientId"" = {id}";
        var record = await connection.QuerySingleAsync<Model>(query);
        return Ok(record);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Model model)
    {
        var query = $@"INSERT INTO ""Patient"" (""Name"", ""Address"", ""Phone"", ""DateOfBirth"", ""Gender"")
                        VALUES ('{model.Name}', '{model.Address}', '{model.Phone}', '{model.DateOfBirth.Date}', '{model.Gender}')
                        RETURNING ""PatientId""";
        var newId = await this.connection.ExecuteScalarAsync(query);
        return await this.GetByIdHelper((int)newId);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Model model)
    {
        var query = $@"UPDATE ""Patient"" SET ""Name"" = '{model.Name}', ""Address"" = '{model.Address}',
                        ""Phone"" = '{model.Phone}', ""DateOfBirth"" = '{model.DateOfBirth.Date}', ""Gender"" = '{model.Gender}'
                        WHERE ""PatientId"" = {id} ";
        var updatedCount = await this.connection.ExecuteAsync(query);
        return Ok(updatedCount);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var query = $@"DELETE FROM ""Patient"" WHERE ""PatientId"" = {id} ";
        var deletedCount = await this.connection.ExecuteAsync(query);
        return Ok(deletedCount);
    }
}

