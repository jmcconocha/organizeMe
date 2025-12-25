import time

def main():
    print("organizeMe v2 worker starting...")
    while True:
        # TODO: implement scanning/queue processing
        print("worker heartbeat")
        time.sleep(30)

if __name__ == "__main__":
    main()
