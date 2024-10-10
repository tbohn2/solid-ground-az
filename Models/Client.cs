using System;
using System.Security.Cryptography;
using System.Text;
using System.ComponentModel.DataAnnotations.Schema;

namespace StretchScheduler.Models
{
    public class Client
    {
        public int Id { get; set; }
        public required string Name { get; set; }
        public string? EncryptedEmail { get; private set; }
        public string? EncryptedPhone { get; private set; }
        public required Guid AdminId { get; set; }
        public int Balance { get; set; } = 0;

        [NotMapped]
        public string Email
        {
            get => Decrypt(EncryptedEmail ?? "");
            set => EncryptedEmail = Encrypt(value);
        }

        [NotMapped]
        public string Phone
        {
            get => Decrypt(EncryptedPhone ?? "");
            set => EncryptedPhone = Encrypt(value);
        }

        private string Encrypt(string plainText)
        {
            using (Aes aesAlg = Aes.Create())
            {
                var KEY = Environment.GetEnvironmentVariable("KEY");
                if (string.IsNullOrEmpty(KEY))
                {
                    throw new Exception("KEY not found in environment variables");
                }

                aesAlg.Key = Encoding.UTF8.GetBytes(KEY);
                aesAlg.GenerateIV();

                var IV = aesAlg.IV;
                ICryptoTransform encryptor = aesAlg.CreateEncryptor(aesAlg.Key, aesAlg.IV);

                using (System.IO.MemoryStream msEncrypt = new System.IO.MemoryStream())
                {
                    msEncrypt.Write(IV, 0, IV.Length);
                    using (CryptoStream csEncrypt = new CryptoStream(msEncrypt, encryptor, CryptoStreamMode.Write))
                    {
                        using (System.IO.StreamWriter swEncrypt = new System.IO.StreamWriter(csEncrypt))
                        {
                            swEncrypt.Write(plainText);
                        }
                    }
                    return Convert.ToBase64String(msEncrypt.ToArray());
                }
            }
        }

        public string Decrypt(string cipherText)
        {
            using (Aes aesAlg = Aes.Create())
            {
                var KEY = Environment.GetEnvironmentVariable("KEY");
                if (string.IsNullOrEmpty(KEY))
                {
                    throw new Exception("KEY not found in environment variables");
                }

                aesAlg.Key = Encoding.UTF8.GetBytes(KEY);

                byte[] encryptedData = Convert.FromBase64String(cipherText);

                byte[] iv = new byte[16];
                Array.Copy(encryptedData, iv, iv.Length);

                using (MemoryStream msDecrypt = new MemoryStream(encryptedData, iv.Length, encryptedData.Length - iv.Length))
                {
                    aesAlg.IV = iv;

                    ICryptoTransform decryptor = aesAlg.CreateDecryptor(aesAlg.Key, aesAlg.IV);

                    using (CryptoStream csDecrypt = new CryptoStream(msDecrypt, decryptor, CryptoStreamMode.Read))
                    {
                        using (StreamReader srDecrypt = new StreamReader(csDecrypt))
                        {
                            return srDecrypt.ReadToEnd();
                        }
                    }
                }
            }
        }
    }
}
