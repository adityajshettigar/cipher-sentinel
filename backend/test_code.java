import java.security.KeyPairGenerator;
import java.security.KeyPair;
import java.security.SecureRandom;

public class LegacyAuthSession {
    public static void generateKeys() throws Exception {
        // VULNERABLE: RSA-2048 will be easily broken by quantum computers using Shor's Algorithm
        KeyPairGenerator keyGen = KeyPairGenerator.getInstance("RSA");
        keyGen.initialize(2048, new SecureRandom());
        KeyPair pair = keyGen.generateKeyPair();
        
        // High data sensitivity indicators for the AST to pick up
        String user_auth_token = "session_secret_data_7749";
        boolean in_transit = true;

        System.out.println("Legacy RSA Key Pair Generated. Ready for transit.");
    }
}