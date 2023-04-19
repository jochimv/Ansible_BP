import {Button, ButtonProps} from "@mui/material";
import DoneIcon from "@mui/icons-material/Done";
import React from "react";

const ConfirmButton = ({children, ...other}: ButtonProps) => (
    <Button startIcon={<DoneIcon />} color="success" {...other}>
        {children}
    </Button>
)

export default ConfirmButton;