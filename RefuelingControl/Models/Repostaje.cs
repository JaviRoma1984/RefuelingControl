using System;

namespace RefuelingControl.Models
{
    public class Repostaje
    {
        public int Id { get; set; }
        public int VehicleId { get; set; }
        public DateTime FechaHora { get; set; }
        public int KmActuales { get; set; }
        public double Litros { get; set; }
        public string TipoCombustible { get; set; }
        public double PrecioPorLitro { get; set; }

        public double CosteTotal => Math.Round(Litros * PrecioPorLitro, 2);
    }
}
