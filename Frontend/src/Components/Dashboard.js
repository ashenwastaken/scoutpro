import React, { useState, useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import logoBlack from "../assets/images/logo_black.svg";
import uploadIcon from "../assets/icons/upload.svg";
import Sample from "../assets/Sample.csv";
import plusIcon from "../assets/icons/plus.png";
import { AuthContext } from "../Context/AuthContext";
import axiosInstance from "../services/axiosInstance";
import Flash from "./Flash";
import PlayersTable from "./PlayersTable";
import Loading from "./Loading";
import bootstrap from "bootstrap/dist/js/bootstrap.bundle.min";
import browserImageCompression from 'browser-image-compression';


export default function Dashboard() {
  const [message, setMessage] = useState("");
  const [players, setPlayers] = useState([]);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    playerName: "",
    playerTeam: "",
    position: "",
    heightWithShoes: "",
    weight: "",
    bodyFat: "",
    wingSpan: "",
    standingReach: "",
    handWidth: "",
    handLength: "",
    standingVert: "",
    maxVert: "",
    laneAgility: "",
    shuttle: "",
    courtSprint: "",
    description: "",
    maxSpeed: "",
    maxJump: "",
    prpp: "",
    acceleration: "",
    deceleration: "",
    ttto: "",
    brakingPhase: "",
    images: [],
    videos: [],
  });

  const { logout, user } = useContext(AuthContext);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const { status, data } = await axiosInstance.get("/players");
        if (status === 200) {
          setPlayers(data);
          setIsLoading(false);
        }
      } catch (error) {
        setMessage(error.response.data);
        setIsLoading(false);
      }
    };

    fetchPlayers();
  }, [players]);

  // const handleDragOver = (e) => {
  //   e.preventDefault();
  //   e.stopPropagation();
  //   setDragActive(true);
  // };

  // const handleDragLeave = (e) => {
  //   e.preventDefault();
  //   e.stopPropagation();
  //   setDragActive(false);
  // };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setFile(droppedFiles[0]); // Set only the first file
      console.log("Dropped File:", droppedFiles[0]);
    }
  };

  const handleExcelFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Compress image if above 4 MB
  const compressImageIfNeeded = async (file) => {
    const fileSizeMB = file.size / 1024 / 1024;
    const MAX_SIZE_MB = 4; // 4 MB limit

    if (fileSizeMB > MAX_SIZE_MB) {
      try {
        const compressedFile = await browserImageCompression(file, {
          maxSizeMB: 4,
          maxWidthOrHeight: 1920, // adjust as needed
          useWebWorker: true,
        });
        return compressedFile;
      } catch (error) {
        console.error("Error while compressing:", error);
        // If compression fails, return the original file or handle as needed
        return file;
      }
    } else {
      return file;
    }
  };


  // Before: const handleFileChange = (e, index) => {
  const handleFileChange = async (e, index) => {
    const { files } = e.target;
    if (!files || !files.length) return;

    // Compress each file if needed
    const compressedImagesPromises = Array.from(files).map(async (file) => {
      const compressed = await compressImageIfNeeded(file);
      return {
        file: compressed,
        path: URL.createObjectURL(compressed),
        fileType: index === 0 ? "mugshot" : "standingshot",
      };
    });

    // Wait for all compression tasks to complete
    const compressedImages = await Promise.all(compressedImagesPromises);

    // Then set them into your state
    setFormData((prevFormData) => ({
      ...prevFormData,
      images: [...prevFormData.images, ...compressedImages],
    }));
  };


  const handleVideoChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => {
      const updatedVideos = [...prevFormData.videos];
      const index = name === "videoUrl1" ? 0 : 1;

      if (updatedVideos.length < 2) {
        updatedVideos[0] = updatedVideos[0] || "";
        updatedVideos[1] = updatedVideos[1] || "";
      }

      updatedVideos[index] = value;

      return {
        ...prevFormData,
        videos: updatedVideos,
      };
    });
  };

  const handleDeleteImage = (index) => {
    const updatedImages = [...formData.images];
    updatedImages.splice(index, 1);

    setFormData({
      ...formData,
      images: updatedImages,
    });
  };

  const handleExcelFileSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    if (!file) {
      alert("No file selected");
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const { status, data } = await axiosInstance.post(
        "/multi-player",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (status === 200) {
        setMessage(data.message || "File uploaded successfully");
        setFile(null); // Reset the file state
        const modalElement = document.getElementById("excelModal");
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        modalInstance.hide();
      }
    } catch (error) {
      console.error("Upload Error:", error);
      setMessage(error.response?.data || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };


  const handlePlayerSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    const submitFormData = new FormData();

    formData.images.forEach((image) => {
      submitFormData.append("images", image.file);
    });

    formData.videos.forEach((videoUrl) => {
      submitFormData.append("videos", videoUrl);
    });

    Object.keys(formData).forEach((key) => {
      if (key !== "images" && key !== "videos") {
        submitFormData.append(key, formData[key]);
      }
    });

    try {
      const { data, status } = await axiosInstance.post(
        "/player-register",
        submitFormData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (status === 201) {
        setMessage(data);
        setFormData({
          playerName: "",
          position: "",
          heightWithShoes: "",
          weight: "",
          bodyFat: "",
          wingSpan: "",
          standingReach: "",
          handWidth: "",
          handLength: "",
          standingVert: "",
          maxVert: "",
          laneAgility: "",
          shuttle: "",
          courtSprint: "",
          description: "",
          maxSpeed: "",
          maxJump: "",
          prpp: "",
          acceleration: "",
          deceleration: "",
          ttto: "",
          brakingPhase: "",
          images: [],
          videos: [],
        });
        const modalElement = document.getElementById("manualPlayer");
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        modalInstance.hide();
        setIsLoading(false);
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.error) {
        setIsLoading(false);
        setMessage(error.response.data);
      }
    }
  };

  if (!user) return null;
  return (
    <>
      <div className="dashBoardBackground">
        <Loading isLoading={isLoading} />
        <section className="container-fluid max-width mx-auto">
          <Flash message={message} setMessage={setMessage} />
          <nav className="navbar navbar-expand-lg">
            <div className="container-fluid">
              <Link className="navbar-brand" to="/dashboard">
                <img
                  src={logoBlack}
                  alt="Scout Pro Logo"
                  height="34"
                  className="d-inline-block align-text-top me-auto"
                />
              </Link>
              <button
                className="navbar-toggler"
                data-bs-toggle="collapse"
                data-bs-target="#navbarTogglerDemo02"
                aria-controls="navbarTogglerDemo02"
                aria-expanded="false"
                aria-label="Toggle navigation"
              >
                <span className="navbar-toggler-icon"></span>
              </button>
              <div
                className="collapse navbar-collapse justify-content-end"
                id="navbarTogglerDemo02"
              >
                <button
                  onClick={() => logout()}
                  type="button"
                  className="logoutBtn me-2"
                >
                  Logout
                </button>
              </div>
            </div>
          </nav>
          <section className="playersTitleContainer">
            <div className="row g-4 g-md-0 justify-content-between align-items-center container-fluid pe-0">
              <div className="col-12 col-md-6 p-0">
                <h2 className="playersTitle">Players</h2>
                <p className="playersSubHeading">Add and Edit your Players</p>
              </div>
              <div className="col-12 col-md-6 p-0">
                <div className="buttonHolder">
                  <div className="svg-wrapper">
                    <svg
                      className="d-none d-lg-block"
                      width="41"
                      height="43"
                      viewBox="0 0 41 43"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle
                        cx="20.16"
                        cy="20.66"
                        r="19.16"
                        stroke="#A40F37"
                        strokeWidth="2"
                      />
                      <path
                        d="M20.1202 15.02C19.2202 15.02 18.4802 14.76 17.9002 14.24C17.3402 13.7 17.0602 13.04 17.0602 12.26C17.0602 11.46 17.3402 10.8 17.9002 10.28C18.4802 9.74 19.2202 9.47 20.1202 9.47C21.0002 9.47 21.7202 9.74 22.2802 10.28C22.8602 10.8 23.1502 11.46 23.1502 12.26C23.1502 13.04 22.8602 13.7 22.2802 14.24C21.7202 14.76 21.0002 15.02 20.1202 15.02ZM22.6702 16.76V33.5H17.5402V16.76H22.6702Z"
                        fill="#A40F37"
                      />
                    </svg>
                    <div className="popover-content d-none d-lg-inline-block">
                      <p className="popoverText">
                        The excel Sheet needs to have this format
                      </p>
                      <div className="sampleDownloadButton">
                        <button type="button" className="sampleDownload">
                          <a href={Sample} download="NBA Sample Sheet.csv">
                            Download
                          </a>
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    data-bs-toggle="modal"
                    data-bs-target="#excelModal"
                    className="uploadExcelButton"
                  >
                    <img alt="Upload Excel" src={uploadIcon} />
                    Upload excel
                  </button>
                  <button
                    type="button"
                    data-bs-toggle="modal"
                    data-bs-target="#manualPlayer"
                    className="addPlayerButton"
                  >
                    <img alt="Add Player" src={plusIcon} />
                    Add player
                  </button>
                </div>
              </div>
            </div>
          </section>
          <PlayersTable
            players={players}
            setMessage={setMessage}
            setIsLoading={setIsLoading}
          />
        </section>
      </div>

            {/* Drag-and-Drop Modal */}
            <div
        className="modal fade"
        id="excelModal"
        tabIndex="-1"
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content px-3 px-md-5">
            <div className="modal-header p-0">
              <h1 className="modalTitle" id="exampleModalLabel">
                Create Multi-Player Registration
              </h1>
            </div>
            <form
              onSubmit={handleExcelFileSubmit}
              className="modal-body p-0"
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragActive(false);
              }}
              onDrop={(e) => {
                handleDrop(e);
                setDragActive(false);
              }}
            >
           <div className="dragDropContainer">
            <img src={uploadIcon} alt="Upload Icon" />
            <p className="dragDropText">
              {fileName ? `Selected File: ${fileName}` : "Drag & drop your file here"}
            </p>
            {!file ? (
              <>
                <label htmlFor="uploadFileBtn" Name="uploadExcelBtn">
                  Browse Files
                </label>
                <input
                  id="uploadFileBtn"
                  type="file"
                  Name="d-none"
                  required
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  onChange={handleExcelFileChange}
                />
              </>
            ) : (
              <button type="submit" className="submitButton w-50">
                Submit
              </button>
            )}
          </div>

          </form>

          </div>
        </div>
      </div>

      <div
        className="modal fade"
        id="excelModal"
        tabIndex="-1"
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content px-3 px-md-5">
            <div className="modal-header p-0">
              <h1 className="modalTitle" id="exampleModalLabel">
                Create Multi-Player Registration
              </h1>
            </div>
            <form onSubmit={handleExcelFileSubmit} className="modal-body p-0">
              <div className="dragDropContainer">
                <img src={uploadIcon} alt="Upload Icon" />
                <p className="dragDropText">
                  {file ? file.name : "Drag & drop your file here"}
                </p>
                {!file ? (
                  <label htmlFor="uploadFileBtn" className="uploadExcelBtn">
                    Browse Files
                  </label>
                ) : (
                  <button type="submit" className="submitButton w-50">
                    Submit
                  </button>
                )}
                <input
                  id="uploadFileBtn"
                  type="file"
                  className="d-none"
                  required
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  onChange={handleExcelFileChange}
                />
              </div>
            </form>
          </div>
        </div>
      </div>

      <div
        className="modal fade"
        id="manualPlayer"
        tabIndex="-1"
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog customWidth modal-dialog-centered">
          <form onSubmit={handlePlayerSubmit} className="modal-content">
            <div className="modal-header p-0">
              <h1 className="modalTitle" id="exampleModalLabel">
                Add Player
              </h1>
              <button
                className="btn-close1"
                data-bs-dismiss="modal"
                aria-label="Close"
                type="button"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  x="0px"
                  y="0px"
                  width="30"
                  height="30"
                  viewBox="0 0 50 50"
                >
                  <path d="M 7.71875 6.28125 L 6.28125 7.71875 L 23.5625 25 L 6.28125 42.28125 L 7.71875 43.71875 L 25 26.4375 L 42.28125 43.71875 L 43.71875 42.28125 L 26.4375 25 L 43.71875 7.71875 L 42.28125 6.28125 L 25 23.5625 Z"></path>
                </svg>
              </button>
            </div>
            <div className="modal-body p-0">
              <div className="inputBlock">
                <p className="inputBlockHeading">Player Pictures</p>
                <div className="row g-2">
                  {formData.images &&
                    formData.images.map((image, index) => (
                      <div
                        key={index}
                        className="col-12 col-sm-6 col-md-4 position-relative"
                      >
                        <img
                          src={image.path}
                          alt={`Player Display ${index + 1}`}
                          className="img-fluid"
                        />
                        <button
                          type="button"
                          className="position-absolute top-0 end-0"
                          aria-label="Close"
                          onClick={() => handleDeleteImage(index)}
                          style={{
                            backgroundColor: "white",
                            border: "2px solid red",
                            cursor: "pointer",
                            padding: "0.2rem",
                            borderRadius: "50%",
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            x="0px"
                            y="0px"
                            width="25"
                            height="20"
                            viewBox="0 0 50 50"
                            fill="red"
                          >
                            <path d="M 7.71875 6.28125 L 6.28125 7.71875 L 23.5625 25 L 6.28125 42.28125 L 7.71875 43.71875 L 25 26.4375 L 42.28125 43.71875 L 43.71875 42.28125 L 26.4375 25 L 43.71875 7.71875 L 42.28125 6.28125 L 25 23.5625 Z"></path>
                          </svg>
                        </button>
                      </div>
                    ))}

                  {formData.images &&
                    formData.images.every(
                      (img) => img.fileType !== "mugshot"
                    ) && (
                      <div className="col-12 col-sm-6 col-md-4">
                        <label htmlFor="mugShot" className="imageUploadField">
                          <span className="fieldText">Player Standing Shot</span>
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 18 18"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <g clipPath="url(#clip0_198_798)">
                              <path
                                d="M18 6.12085C17.9467 6.43709 17.9075 6.75685 17.8375 7.06956C17.5943 8.15701 17.0486 9.07842 16.2655 9.86241C13.9792 12.1514 11.6871 14.4342 9.40608 16.7289C8.93305 17.2046 8.26886 17.0641 8.02882 16.5858C7.87951 16.2876 7.90417 15.996 8.09841 15.7247C8.1561 15.6445 8.22878 15.5745 8.29925 15.504C10.5534 13.249 12.8067 10.9935 15.0631 8.74104C15.6582 8.14732 16.0872 7.45979 16.2532 6.63088C16.5501 5.14747 16.1735 3.84949 15.0909 2.78978C14.195 1.91286 13.0921 1.54817 11.8466 1.65873C10.8529 1.74681 10.0055 2.1692 9.30037 2.87435C6.99994 5.1739 4.69643 7.4708 2.40128 9.77564C1.05926 11.1234 1.56224 13.3199 3.34691 13.8986C4.22912 14.1845 5.03425 13.9977 5.74204 13.3987C5.80458 13.3459 5.86272 13.2877 5.92086 13.2296C8.00151 11.1494 10.0808 9.06785 12.1628 6.9894C12.4134 6.73923 12.5482 6.46087 12.4478 6.10455C12.2905 5.54475 11.6255 5.32453 11.1639 5.67864C11.0943 5.73194 11.0318 5.79448 10.9697 5.85614C9.63071 7.19421 8.29264 8.53359 6.95326 9.87121C6.60046 10.2236 6.14945 10.2636 5.80062 9.98C5.46148 9.70429 5.39761 9.21099 5.65792 8.8604C5.69976 8.80402 5.74821 8.75249 5.79754 8.70272C7.15674 7.34308 8.51418 5.98211 9.87603 4.62555C10.7318 3.77329 11.9474 3.61869 12.953 4.22562C14.2527 5.01005 14.5218 6.83392 13.5044 7.96146C13.4374 8.03545 13.3687 8.10724 13.2983 8.17771C11.2388 10.2377 9.17617 12.2945 7.12106 14.3584C6.40975 15.0733 5.57291 15.5318 4.56738 15.6379C3.40637 15.7608 2.35019 15.4662 1.4627 14.6993C0.26734 13.6656 -0.191161 12.343 0.0717832 10.7878C0.215367 9.9386 0.629824 9.21804 1.23984 8.60891C3.54071 6.3098 5.83938 4.00805 8.14113 1.70982C8.98458 0.867691 9.98658 0.302603 11.1634 0.101321C13.2525 -0.255878 15.0464 0.332553 16.4994 1.88423C17.3821 2.82678 17.8555 3.96136 17.9744 5.24613C17.9789 5.29194 17.9916 5.3373 18.0009 5.38267V6.12129L18 6.12085Z"
                                fill="#A40F37"
                              />
                            </g>
                            <defs>
                              <clipPath id="clip0_198_798">
                                <rect
                                  width="18"
                                  height="17.0231"
                                  fill="white"
                                />
                              </clipPath>
                            </defs>
                          </svg>
                        </label>
                        <input
                          id="mugShot"
                          name="mugShot"
                          type="file"
                          accept=".png, .jpeg, .jpg"
                          //required
                          className="d-none"
                          onChange={(e) => handleFileChange(e, 0)}
                        />
                      </div>
                    )}
                  {formData.images &&
                    formData.images.every(
                      (img) => img.fileType !== "standingshot"
                    ) && (
                      <div className="col-12 col-sm-6 col-md-4">
                        <label
                          htmlFor="standingShot"
                          className="imageUploadField"
                        >
                          <span className="fieldText">
                            Player Mugshot
                          </span>
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 18 18"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <g clipPath="url(#clip0_198_798)">
                              <path
                                d="M18 6.12085C17.9467 6.43709 17.9075 6.75685 17.8375 7.06956C17.5943 8.15701 17.0486 9.07842 16.2655 9.86241C13.9792 12.1514 11.6871 14.4342 9.40608 16.7289C8.93305 17.2046 8.26886 17.0641 8.02882 16.5858C7.87951 16.2876 7.90417 15.996 8.09841 15.7247C8.1561 15.6445 8.22878 15.5745 8.29925 15.504C10.5534 13.249 12.8067 10.9935 15.0631 8.74104C15.6582 8.14732 16.0872 7.45979 16.2532 6.63088C16.5501 5.14747 16.1735 3.84949 15.0909 2.78978C14.195 1.91286 13.0921 1.54817 11.8466 1.65873C10.8529 1.74681 10.0055 2.1692 9.30037 2.87435C6.99994 5.1739 4.69643 7.4708 2.40128 9.77564C1.05926 11.1234 1.56224 13.3199 3.34691 13.8986C4.22912 14.1845 5.03425 13.9977 5.74204 13.3987C5.80458 13.3459 5.86272 13.2877 5.92086 13.2296C8.00151 11.1494 10.0808 9.06785 12.1628 6.9894C12.4134 6.73923 12.5482 6.46087 12.4478 6.10455C12.2905 5.54475 11.6255 5.32453 11.1639 5.67864C11.0943 5.73194 11.0318 5.79448 10.9697 5.85614C9.63071 7.19421 8.29264 8.53359 6.95326 9.87121C6.60046 10.2236 6.14945 10.2636 5.80062 9.98C5.46148 9.70429 5.39761 9.21099 5.65792 8.8604C5.69976 8.80402 5.74821 8.75249 5.79754 8.70272C7.15674 7.34308 8.51418 5.98211 9.87603 4.62555C10.7318 3.77329 11.9474 3.61869 12.953 4.22562C14.2527 5.01005 14.5218 6.83392 13.5044 7.96146C13.4374 8.03545 13.3687 8.10724 13.2983 8.17771C11.2388 10.2377 9.17617 12.2945 7.12106 14.3584C6.40975 15.0733 5.57291 15.5318 4.56738 15.6379C3.40637 15.7608 2.35019 15.4662 1.4627 14.6993C0.26734 13.6656 -0.191161 12.343 0.0717832 10.7878C0.215367 9.9386 0.629824 9.21804 1.23984 8.60891C3.54071 6.3098 5.83938 4.00805 8.14113 1.70982C8.98458 0.867691 9.98658 0.302603 11.1634 0.101321C13.2525 -0.255878 15.0464 0.332553 16.4994 1.88423C17.3821 2.82678 17.8555 3.96136 17.9744 5.24613C17.9789 5.29194 17.9916 5.3373 18.0009 5.38267V6.12129L18 6.12085Z"
                                fill="#A40F37"
                              />
                            </g>
                            <defs>
                              <clipPath id="clip0_198_798">
                                <rect
                                  width="18"
                                  height="17.0231"
                                  fill="white"
                                />
                              </clipPath>
                            </defs>
                          </svg>
                        </label>
                        <input
                          id="standingShot"
                          name="standingShot"
                          type="file"
                          accept=".png, .jpeg, .jpg"
                          //required
                          className="d-none"
                          onChange={(e) => handleFileChange(e, 1)}
                        />
                      </div>
                    )}
                </div>
              </div>
              <div className="inputBlock">
                <p className="inputBlockHeading">Player Video(s)</p>
                <div className="row g-2">
                  <div className="col-12 col-md-6">
                    <input
                      name="videoUrl1"
                      placeholder="Video url"
                      type="text"
                      //required
                      value={formData.videos[0] || ""}
                      onChange={handleVideoChange}
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <input
                      name="videoUrl2"
                      placeholder="Video url (optional)"
                      type="text"
                      value={formData.videos[1] || ""}
                      onChange={handleVideoChange}
                    />
                  </div>
                </div>
              </div>
              <div className="inputBlock">
                <p className="inputBlockHeading">Player Info</p>
                <div className="row g-2">
                  <div className="col-12 col-sm-6 col-md-4">
                    <input
                      name="playerName"
                      type="text"
                      required
                      placeholder="PLAYER NAME"
                      value={formData.playerName}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-12 col-sm-6 col-md-4">
                    <input
                      name="playerTeam"
                      type="text"
                      //required
                      placeholder="PLAYER Team"
                      value={formData.playerTeam}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-12 col-sm-6 col-md-4">
                    <input
                      name="position"
                      type="text"
                      //required
                      placeholder="POS"
                      value={formData.position}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-12 col-sm-6 col-md-4">
                    <input
                      name="heightWithShoes"
                      type="text"
                      //required
                      placeholder="HT. W/ SHOES"
                      value={formData.heightWithShoes}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-12 col-sm-6 col-md-4">
                    <input
                      name="weight"
                      type="text"
                      //required
                      placeholder="WEIGHT"
                      value={formData.weight}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-12 col-sm-6 col-md-4">
                    <input
                      name="bodyFat"
                      type="text"
                      //required
                      placeholder="BODY COMP"
                      value={formData.bodyFat}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-12 col-sm-6 col-md-4">
                    <input
                      name="wingSpan"
                      type="text"
                      //required
                      placeholder="WINGSPAN"
                      value={formData.wingSpan}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-12 col-sm-6 col-md-4">
                    <input
                      name="standingReach"
                      type="text"
                      //required
                      placeholder="STANDING REACH"
                      value={formData.standingReach}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-12 col-sm-6 col-md-4">
                    <input
                      name="handWidth"
                      type="text"
                      //required
                      placeholder="HAND WIDTH"
                      value={formData.handWidth}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-12 col-sm-6 col-md-4">
                    <input
                      name="handLength"
                      type="text"
                      //required
                      placeholder="HAND LENGTH"
                      value={formData.handLength}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-12 col-sm-6 col-md-4">
                    <input
                      name="standingVert"
                      type="text"
                      //required
                      placeholder="STANDING VERT"
                      value={formData.standingVert}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-12 col-sm-6 col-md-4">
                    <input
                      name="maxVert"
                      type="text"
                      //required
                      placeholder="MAX VERT"
                      value={formData.maxVert}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-12 col-sm-6 col-md-4">
                    <input
                      name="laneAgility"
                      type="text"
                      //required
                      placeholder="LANE AGILITY"
                      value={formData.laneAgility}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-12 col-sm-6 col-md-4">
                    <input
                      name="shuttle"
                      type="text"
                      //required
                      placeholder="SHUTTLE"
                      value={formData.shuttle}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-12 col-sm-6 col-md-4">
                    <input
                      name="courtSprint"
                      type="text"
                      //required
                      placeholder="3/4 COURT SPRINT"
                      value={formData.courtSprint}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-12 col-sm-6 col-md-4">
                    <input
                      name="maxSpeed"
                      type="text"
                      //required
                      placeholder="MAX SPEED"
                      value={formData.maxSpeed}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-12 col-sm-6 col-md-4">
                    <input
                      name="maxJump"
                      type="text"
                      //required
                      placeholder="MAX JUMP HEIGHT"
                      value={formData.maxJump}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-12 col-sm-6 col-md-4">
                    <input
                      name="prpp"
                      type="text"
                      //required
                      placeholder="PROPULSIVE POWER"
                      value={formData.prpp}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-12 col-sm-6 col-md-4">
                    <input
                      name="acceleration"
                      type="text"
                      //required
                      placeholder="ACCELERATION"
                      value={formData.acceleration}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-12 col-sm-6 col-md-4">
                    <input
                      name="deceleration"
                      type="text"
                      //required
                      placeholder="DECELERATION"
                      value={formData.deceleration}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-12 col-sm-6 col-md-4">
                    <input
                      name="ttto"
                      type="text"
                      //required
                      placeholder="TAKE OFF"
                      value={formData.ttto}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-12 col-sm-6 col-md-4">
                    <input
                      name="brakingPhase"
                      type="text"
                      //required
                      placeholder="BRAKING PHASE"
                      value={formData.brakingPhase}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
              <div className="inputBlock">
                <p className="inputBlockHeading">Player Description</p>
                <div className="textAreWrapper">
                  <textarea
                    name="description"
                    onInput={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    id="description"
                    placeholder="Enter Description"
                    maxLength="500"
                    value={formData.description}
                  ></textarea>
                  <div id="wordCount" className="word-count">
                    {formData.description.length}/500 words
                  </div>
                </div>
              </div>
            </div>
            <div className="row g-2">
              <div className="col-12 col-sm-6">
                <button
                  type="button"
                  className="cancelButton"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
              </div>
              <div className="col-12 col-sm-6">
                <button type="submit" className="submitButton">
                  Save
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
