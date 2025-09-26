import speedtest
import time
from datetime import datetime

def log_speed():
    # Initialize Speedtest
    st = speedtest.Speedtest()
    st.get_best_server()
    
    # Measure download and upload speed (in Mbps)
    download_speed = st.download() / 1_000_000   # convert from bits/s to Mbps
    upload_speed = st.upload() / 1_000_000
    ping = st.results.ping
    
    return download_speed, upload_speed, ping

def main():
    log_file = "network_speed_log.txt"
    print(f"Logging network speed every 1 minute into {log_file}...")

    while True:
        try:
            download, upload, ping = log_speed()
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            log_entry = f"{timestamp} | Download: {download:.2f} Mbps | Upload: {upload:.2f} Mbps | Ping: {ping} ms\n"
            
            # Write to log file
            with open(log_file, "a") as f:
                f.write(log_entry)
            
            print(log_entry.strip())
            
        except Exception as e:
            print("Error:", e)
        
        time.sleep(60)  # wait for 1 minute

if __name__ == "__main__":
    main()
